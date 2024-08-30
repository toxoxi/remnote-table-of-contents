import { BuiltInPowerupCodes, RNPlugin, Rem, RemId } from '@remnote/plugin-sdk';

type Content = {
  [remId: RemId]: {
    depth: number;
    text: string;
    children: Content[];
  };
};

const MAX_DEPTH = 4 as const;

export async function generateContents(root: Rem, plugin: RNPlugin): Promise<Content[]> {
  const childrenRem = await root.getChildrenRem();
  const contents = await buildChildren(1, childrenRem, plugin);
  return contents;
}

async function buildChildren(
  depth: number,
  childrenRem: Rem[],
  plugin: RNPlugin
): Promise<Content[]> {
  if (depth > MAX_DEPTH) {
    return [];
  }

  const children = await Promise.all(
    childrenRem.map(async (child) => {
      const isHeader = await isHeaderRem(child);
      if (!isHeader) {
        return {};
      }

      return buildContent(depth, child, plugin);
    })
  );

  return children.filter((child) => Object.keys(child).length !== 0);
}

async function buildContent(depth: number, rem: Rem, plugin: RNPlugin): Promise<Content> {
  const [id, text, childrenRem] = await extractAttributes(rem, plugin);
  const children = await buildChildren(depth + 1, childrenRem, plugin);

  const content = {
    [id]: {
      depth,
      text,
      children,
    },
  };
  return content;
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

async function isHeaderRem(rem: Rem): Promise<boolean> {
  return await rem.hasPowerup(BuiltInPowerupCodes.Header);
}

export type FlatContent = {
  id: RemId;
  depth: number;
  text: string;
};
// convert nested Content to flat list
// - before: [{ [id_1]: { depth: 1, text: 'hoge', children: [ { [id_2]: ... }, { [id_3]: ... } ] }}, { [id_4]: ... }]
// - after: [{ id: id_1, depth: 1, text: 'hoge' }, { id: id_2, depth: 2, text: 'fuga' }, { id: id_3, depth: 2, text: 'piyo' }, { id: id_4, depth: 1, text: 'foo' } }]
export function convertContentsToFlatList(contents: Content[]): FlatContent[] {
  const flatContents = contents.flatMap((content) => {
    const [id, depth, text, children] = extractContent(content);
    return [{ id, depth, text }, ...convertContentsToFlatList(children)];
  });
  return flatContents;
}

function extractContent(
  content: Content
): [id: RemId, depth: number, text: string, children: Content[]] {
  const id = Object.keys(content)[0];
  const depth = content[id].depth;
  const text = content[id].text;
  const children = content[id].children;

  return [id, depth, text, children];
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
