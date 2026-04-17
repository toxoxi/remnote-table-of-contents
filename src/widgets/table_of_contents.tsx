import { renderWidget, usePlugin, useTracker, RemId } from '@remnote/plugin-sdk';
import {
  convertContentsToFlatList,
  expandHighestCollapsedAncestor,
  generateContents,
} from '../lib/utils';

export const TableOfContentsWidget = () => {
  const plugin = usePlugin();
  const lastOpenedRemId = useTracker(async (reactivePlugin) => {
    return await reactivePlugin.storage.getLocal('TOC_lastOpenedRemId');
  });
  const showLevels = useTracker(async (reactivePlugin) => {
    return await reactivePlugin.settings.getSetting<boolean>('show-heading-levels');
  });

  const contents =
    useTracker(
      async (reactivePlugin) => {
        const paneId = await reactivePlugin.window.getFocusedPaneId();
        const remId = await reactivePlugin.window.getOpenPaneRemId(paneId);
        const rem = await reactivePlugin.rem.findOne(remId);
        if (!rem) return [];
        await rem.allRemInDocumentOrPortal(); // track the changes of all rems
        return await generateContents(rem, plugin);
      },
      [lastOpenedRemId]
    ) || [];

  if (contents.length === 0) {
    return (
      <nav className="rounded py-1 px-4">
        <h1 className="text-lg">No headings in this page</h1>
        <p>Use headings to create a table of contents and organize your knowledge!</p>
      </nav>
    );
  }

  const flatContents = convertContentsToFlatList(contents);

  const jumpToRem = async (remId: RemId) => {
    await expandHighestCollapsedAncestor(remId, plugin);
    const rem = await plugin.rem.findOne(remId);
    const parentRemId = await plugin.window.getOpenPaneRemId(
      await plugin.window.getFocusedPaneId()
    );
    await rem?.openRemInContext(parentRemId);
  };

  return (
    <nav className="rounded py-1 px-4 h-full overflow-y-auto">
      <h1 className="text-lg">Contents</h1>
      <hr className="border-gray-300" />
      <ul className="p-0 space-y-3 list-none">
        {flatContents.map((content, i) => (
          <li
            key={`${content.id}_${i}`}
            style={{ marginLeft: `${(content.depth - 1) * 16}px` }}
          >
            <a
              href="#"
              onClick={async () => await jumpToRem(content.id)}
              className="flex items-baseline gap-2 text-base no-underline text-gray-700 hover:text-gray-900 hover:underline"
            >
              {showLevels && (
                <span className="text-xs font-semibold uppercase tracking-wide text-gray-400 shrink-0 w-6">
                  H{content.depth}
                </span>
              )}
              <span>{content.text}</span>
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
};

renderWidget(TableOfContentsWidget);
