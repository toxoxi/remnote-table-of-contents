import { BuiltInPowerupCodes, RNPlugin, Rem, RemId } from '@remnote/plugin-sdk';

export type TocNode = {
  id: RemId;
  depth: number;
  text: string;
  rawSize: string;
  children: TocNode[];
};

// Recursion guard against pathologically deep bullet trees.
const MAX_REM_DEPTH = 50 as const;

export async function generateContents(root: Rem, plugin: RNPlugin): Promise<TocNode[]> {
  const childrenRem = await root.getChildrenRem();
  const flat = await collectHeadings(0, childrenRem, plugin);
  return buildTreeByHeadingLevel(flat);
}

// Walk the bullet tree in document order and collect every real heading as a
// leaf node (children = []). Non-header rems are not emitted but we still
// descend into them so headings nested under plain bullets are not lost.
async function collectHeadings(
  remDepth: number,
  rems: Rem[],
  plugin: RNPlugin
): Promise<TocNode[]> {
  if (remDepth > MAX_REM_DEPTH) return [];

  const perRem = await Promise.all(
    rems.map(async (rem): Promise<TocNode[]> => {
      const out: TocNode[] = [];
      const header = await getHeaderInfo(rem);
      if (header) {
        const text = rem.text ? await plugin.richText.toString(rem.text) : '';
        out.push({
          id: rem._id,
          depth: header.depth,
          text,
          rawSize: header.rawSize,
          children: [],
        });
      }
      const childrenRem = await rem.getChildrenRem();
      const descendants = await collectHeadings(remDepth + 1, childrenRem, plugin);
      return [...out, ...descendants];
    })
  );

  return perRem.flat();
}

// Re-nest a flat heading list by H-level rather than bullet position — so an
// H2 becomes a child of the most recent H1, regardless of whether they share
// a bullet parent. Orphans (e.g. an H3 with no preceding higher-level heading)
// surface at their own level. Classic stack-based TOC build.
function buildTreeByHeadingLevel(flat: TocNode[]): TocNode[] {
  const roots: TocNode[] = [];
  const stack: TocNode[] = [];
  for (const node of flat) {
    while (stack.length > 0 && stack[stack.length - 1].depth >= node.depth) {
      stack.pop();
    }
    if (stack.length === 0) {
      roots.push(node);
    } else {
      stack[stack.length - 1].children.push(node);
    }
    stack.push(node);
  }
  return roots;
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
