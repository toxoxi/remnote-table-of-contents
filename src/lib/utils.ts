import { BuiltInPowerupCodes, RNPlugin, Rem, RemId } from "@remnote/plugin-sdk";

type Content = {
  [remId: RemId]: {
    depth: number;
    text: string;
    children: Content[];
  }
}

const MAX_DEPTH = 4 as const;

export async function generateContents(root: Rem, plugin: RNPlugin): Promise<Content[]> {
  const childrenRem = await root.getChildrenRem();
  const contents = await buildChildren(1, childrenRem, plugin);
  return contents;
}

async function buildChildren(depth: number, childrenRem: Rem[], plugin: RNPlugin): Promise<Content[]> {
  if (depth > MAX_DEPTH) { return []; }

  const children = await Promise.all(
    childrenRem.map(async (child) => {
      const isHeader = await isHeaderRem(child);
      if (!isHeader) { return {}; }
    
      return buildContent(depth, child, plugin);
    })
  )

  return children.filter(child => Object.keys(child).length !== 0);
}

async function buildContent(depth: number, rem: Rem, plugin: RNPlugin): Promise<Content> {
  const [id, text, childrenRem] = await extractAttributes(rem, plugin)
  const children = await buildChildren(depth+1, childrenRem, plugin);

  const content = {
    [id]: {
      depth,
      text,
      children,
    }
  };
  return content;
}

async function extractAttributes(rem: Rem, plugin: RNPlugin): Promise<[id: string, text: string, children: Rem[]]> {
  const id = rem._id;
  const text = await plugin.richText.toString(rem.text);
  const childrenRem = await rem.getChildrenRem();

  return [id, text, childrenRem];
}

async function isHeaderRem(rem: Rem): Promise<boolean> {
  return await rem.hasPowerup(BuiltInPowerupCodes.Header);
}
