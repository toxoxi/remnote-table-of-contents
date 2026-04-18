import { renderWidget, usePlugin, useTracker, RemId } from '@remnote/plugin-sdk';
import { useState } from 'react';
import {
  TocNode,
  expandHighestCollapsedAncestor,
  generateContents,
} from '../lib/utils';

const CHEVRON_WIDTH_PX = 16;
// Child lists indent by exactly the chevron's width, so the guide line drawn
// down the middle of that gutter lines up with the parent row's chevron.
const INDENT_PX = CHEVRON_WIDTH_PX;

export const TableOfContentsWidget = () => {
  const plugin = usePlugin();

  const lastOpenedRemId = useTracker(async (reactivePlugin) => {
    return await reactivePlugin.storage.getLocal('TOC_lastOpenedRemId');
  });
  const showLevels =
    useTracker(async (rp) => rp.settings.getSetting<boolean>('show-heading-levels')) ?? false;
  const showGuides =
    useTracker(async (rp) => rp.settings.getSetting<boolean>('show-indent-guides')) ?? false;

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

  const [collapsed, setCollapsed] = useState<Set<RemId>>(new Set());
  const toggleCollapsed = (id: RemId) => {
    setCollapsed((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const jumpToRem = async (remId: RemId) => {
    await expandHighestCollapsedAncestor(remId, plugin);
    const rem = await plugin.rem.findOne(remId);
    const parentRemId = await plugin.window.getOpenPaneRemId(
      await plugin.window.getFocusedPaneId()
    );
    await rem?.openRemInContext(parentRemId);
  };

  const rootClasses = ['toc', showGuides ? 'toc-show-guides' : '']
    .filter(Boolean)
    .join(' ');

  if (contents.length === 0) {
    return (
      <nav className={rootClasses}>
        <h1>No headings in this page</h1>
        <p>Use headings to create a table of contents and organize your knowledge!</p>
        <TocStyles />
      </nav>
    );
  }

  return (
    <nav className={rootClasses}>
      <h1>Contents</h1>
      <hr />
      <ul className="toc-list toc-list-root">
        {contents.map((node) => (
          <TocTreeItem
            key={node.id}
            node={node}
            collapsed={collapsed}
            toggleCollapsed={toggleCollapsed}
            onJump={jumpToRem}
            showLevels={showLevels}
          />
        ))}
      </ul>
      <TocStyles />
    </nav>
  );
};

type TreeItemProps = {
  node: TocNode;
  collapsed: Set<RemId>;
  toggleCollapsed: (id: RemId) => void;
  onJump: (id: RemId) => void | Promise<void>;
  showLevels: boolean;
};

const TocTreeItem = ({
  node,
  collapsed,
  toggleCollapsed,
  onJump,
  showLevels,
}: TreeItemProps) => {
  const isCollapsed = collapsed.has(node.id);
  const hasChildren = node.children.length > 0;

  return (
    <li className="toc-item">
      <div className="toc-row">
        <button
          type="button"
          className="toc-chevron"
          onClick={hasChildren ? () => toggleCollapsed(node.id) : undefined}
          aria-label={hasChildren ? (isCollapsed ? 'Expand' : 'Collapse') : undefined}
          tabIndex={hasChildren ? 0 : -1}
          data-has-children={hasChildren ? 'true' : 'false'}
        >
          {hasChildren ? (isCollapsed ? '▸' : '▾') : ''}
        </button>
        {showLevels && <span className="toc-level">H{node.depth}</span>}
        <a
          href="#"
          className="toc-link"
          onClick={async (e) => {
            e.preventDefault();
            await onJump(node.id);
          }}
        >
          {node.text}
        </a>
      </div>
      {hasChildren && !isCollapsed && (
        <ul className="toc-list">
          {node.children.map((child) => (
            <TocTreeItem
              key={child.id}
              node={child}
              collapsed={collapsed}
              toggleCollapsed={toggleCollapsed}
              onJump={onJump}
              showLevels={showLevels}
            />
          ))}
        </ul>
      )}
    </li>
  );
};

// Scoped CSS — uses `currentColor` + opacity so it inherits from RemNote's
// theme (light / dark / custom user CSS) without hard-coding palette values.
const TocStyles = () => (
  <style>{`
    /* The SDK adds .dark or .light on <body> based on the host theme, and
       propagates the user's RemNote custom CSS into the widget (including
       vars like --2ndary-color). We prefer those vars when present, and
       pick a neutral default matching the active mode otherwise. */
    .toc {
      color: inherit;
      background: var(--2ndary-color, #f4f4f5);
      padding: 0.25rem 1rem;
      height: 100%;
      overflow-y: auto;
      border-radius: 0.25rem;
    }
    body.dark .toc {
      background: var(--2ndary-color, #1f1f23);
    }
    .toc h1 {
      font-size: 1.125rem;
      margin: 0 0 0.25rem;
      font-weight: 600;
    }
    .toc hr {
      border: 0;
      border-top: 1px solid currentColor;
      opacity: 0.15;
      margin: 0.25rem 0;
    }
    .toc p { margin: 0.25rem 0; opacity: 0.75; }

    .toc-list {
      list-style: none;
      margin: 0;
      padding: 0;
    }
    /* Every nested list is indented by one chevron-width gutter — the same
       gutter we paint the guide line down the middle of. */
    .toc-list:not(.toc-list-root) {
      padding-left: ${INDENT_PX}px;
      position: relative;
    }
    .toc.toc-show-guides .toc-list:not(.toc-list-root)::before {
      content: '';
      position: absolute;
      left: ${INDENT_PX / 2}px;
      top: 0;
      bottom: 0;
      border-left: 1px solid currentColor;
      opacity: 0.2;
      pointer-events: none;
    }

    .toc-item { margin: 0; }
    .toc-row {
      display: flex;
      align-items: center;
      gap: 0.25rem;
      padding: 1px 0;
      line-height: 1.4;
    }
    .toc-chevron {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: ${CHEVRON_WIDTH_PX}px;
      height: ${CHEVRON_WIDTH_PX}px;
      padding: 0;
      margin: 0;
      border: 0;
      background: transparent;
      color: inherit;
      font-size: 0.75rem;
      line-height: 1;
      cursor: pointer;
      opacity: 0.55;
      flex-shrink: 0;
    }
    .toc-chevron[data-has-children='false'] {
      cursor: default;
      visibility: hidden;
    }
    .toc-chevron:hover { opacity: 1; }
    .toc-level {
      font-size: 0.7rem;
      font-weight: 600;
      letter-spacing: 0.04em;
      text-transform: uppercase;
      opacity: 0.5;
      flex-shrink: 0;
      min-width: 1.5rem;
    }
    .toc-link {
      color: inherit;
      text-decoration: none;
      flex: 1 1 auto;
      min-width: 0;
      word-break: break-word;
    }
    .toc-link:hover { text-decoration: underline; }
  `}</style>
);

renderWidget(TableOfContentsWidget);
