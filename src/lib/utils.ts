import { BuiltInPowerupCodes, RNPlugin, Rem, RemId } from '@remnote/plugin-sdk';

type Content = {
  [remId: RemId]: {
    depth: number;
    text: string;
    rawSize: string;
    children: Content[];
  };
};

// Recursion guard against pathologically deep bullet trees.
const MAX_REM_DEPTH = 50 as const;

export async function generateContents(root: Rem, plugin: RNPlugin): Promise<Content[]> {
  const childrenRem = await root.getChildrenRem();
  const contents = await buildChildren(0, childrenRem, plugin);
  return contents;
}

async function buildChildren(
  remDepth: number,
  childrenRem: Rem[],
  plugin: RNPlugin
): Promise<Content[]> {
  if (remDepth > MAX_REM_DEPTH) {
    return [];
  }

  const results = await Promise.all(
    childrenRem.map(async (child): Promise<Content[]> => {
      const header = await getHeaderInfo(child);
      if (header) {
        return [await buildContent(child, plugin, remDepth, header)];
      }
      // Not a header: keep descending so headers nested under plain rems
      // (bullets, paragraphs, etc.) still appear in the TOC.
      const grandchildren = await child.getChildrenRem();
      return buildChildren(remDepth + 1, grandchildren, plugin);
    })
  );

  return results.flat();
}

async function buildContent(
  rem: Rem,
  plugin: RNPlugin,
  remDepth: number,
  header: { depth: number; rawSize: string }
): Promise<Content> {
  const [id, text, childrenRem] = await extractAttributes(rem, plugin);
  const children = await buildChildren(remDepth + 1, childrenRem, plugin);

  return {
    [id]: {
      depth: header.depth,
      text,
      rawSize: header.rawSize,
      children,
    },
  };
}

// Returns heading info only if the rem is a *real* heading — the Header powerup
// is attached AND its Size slot encodes a level in 1..6. Un-headinged rems keep
// the powerup attached but clear Size to 0/empty, which we must reject so those
// ghost entries don't show up as plain bullets in the TOC.
async function getHeaderInfo(rem: Rem): Promise<{ depth: number; rawSize: string } | null> {
  if (!(await rem.hasPowerup(BuiltInPowerupCodes.Header))) return null;
  try {
    const raw = await rem.getPowerupProperty(BuiltInPowerupCodes.Header, 'Size');
    if (raw == null) return null;
    const rawSize = String(raw);
    const match = rawSize.match(/[1-6]/);
    if (!match) return null;
    return { depth: parseInt(match[0], 10), rawSize };
  } catch {
    return null;
  }
}

async function extractAttributes(
  rem: Rem,
  plugin: RNPlugin
): Promise<[id: string, text: string, children: Rem[]]> {
  const id = rem._id;
  const text = rem.text ? await plugin.richText.toString(rem.text) : '';
  const childrenRem = await rem.getChildrenRem();

  return [id, text, childrenRem];
}

export type FlatContent = {
  id: RemId;
  depth: number;
  text: string;
  rawSize: string;
};
// convert nested Content to flat list
export function convertContentsToFlatList(contents: Content[]): FlatContent[] {
  return contents.flatMap((content) => {
    const [id, depth, text, rawSize, children] = extractContent(content);
    return [{ id, depth, text, rawSize }, ...convertContentsToFlatList(children)];
  });
}

function extractContent(
  content: Content
): [id: RemId, depth: number, text: string, rawSize: string, children: Content[]] {
  const id = Object.keys(content)[0];
  const { depth, text, rawSize, children } = content[id];
  return [id, depth, text, rawSize, children];
}

export const expandHighestCollapsedAncestor = async (remId: RemId, plugin: RNPlugin) => {
  const pane = await plugin.window.getFocusedPaneId();
  const documentRemId = await plugin.window.getOpenPaneRemId(pane);

  let currentRem = await plugin.rem.findOne(remId);
  if (!currentRem || !documentRemId || documentRemId === currentRem._id) return;

  let highestCollapsedId: RemId | undefined;
  while (currentRem?.parent && currentRem._id !== documentRemId) {
    const isCollapsed = await currentRem.isCollapsed(documentRemId);
    if (isCollapsed) {
      highestCollapsedId = currentRem._id;
    }
    currentRem = await plugin.rem.findOne(currentRem.parent);
  }

  const expandTarget = await plugin.rem.findOne(highestCollapsedId);
  await expandTarget?.expand(documentRemId, true);
};

export function isMobileOs(os: string): boolean {
  return os === 'ios' || os === 'android';
}
