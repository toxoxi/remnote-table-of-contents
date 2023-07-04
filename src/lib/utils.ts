import { BuiltInPowerupCodes, RNPlugin, Rem } from "@remnote/plugin-sdk";

type Content = {
  [remId: string]: {
    text: string;
    children: Content[];
  }
}

export async function generateContents(root: Rem, plugin: RNPlugin): Promise<Content[]> {
  const childrenRem = await root.getChildrenRem();
  const contents = await buildChildren(childrenRem, plugin);
  return contents;
}

async function buildChildren(childrenRem: Rem[], plugin: RNPlugin): Promise<Content[]> {
  const children = await Promise.all(
    childrenRem.map(async (child) => {
      const isHeader = await isHeaderRem(child);
      if (!isHeader) { return {}; }
    
      return buildContent(child, plugin);
    })
  )

  return children.filter(child => Object.keys(child).length !== 0);
}

async function buildContent(rem: Rem, plugin: RNPlugin): Promise<Content> {
  const [id, text, childrenRem] = await extractAttributes(rem, plugin)
  const children = await buildChildren(childrenRem, plugin);

  const content = {
    [id]: {
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
