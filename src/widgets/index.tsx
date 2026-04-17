import {
  AppEvents,
  declareIndexPlugin,
  ReactRNPlugin,
  RemId,
  WidgetLocation,
} from '@remnote/plugin-sdk';
import '../style.css';
import '../App.css';
import { isMobileOs } from '../lib/utils';

async function onActivate(plugin: ReactRNPlugin) {
  await plugin.settings.registerBooleanSetting({
    id: 'show-heading-levels',
    title: 'Show heading levels',
    description:
      'Display a small H1/H2/H3 label next to each entry in the table of contents.',
    defaultValue: false,
  });

  // Register a sidebar widget.
  const os = await plugin.app.getOperatingSystem();

  const location = isMobileOs(os) ? WidgetLocation.LeftSidebar : WidgetLocation.RightSidebar;

  await plugin.app.registerWidget('table_of_contents', location, {
    dimensions: { height: 'auto', width: '100%' },
    widgetTabIcon: `${plugin.rootURL}toc_icon.png`,
    widgetTabTitle: 'Table of Contents',
  });

  plugin.event.addListener(AppEvents.GlobalOpenRem, undefined, async (message) => {
    const remId = message.remId as RemId;
    await plugin.storage.setLocal('TOC_lastOpenedRemId', remId);
  });
}

async function onDeactivate(_: ReactRNPlugin) {}

declareIndexPlugin(onActivate, onDeactivate);
