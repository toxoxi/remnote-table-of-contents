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
  // Register a sidebar widget.
  let os = await plugin.app.getOperatingSystem();

  let location = WidgetLocation.RightSidebar;
  if (isMobileOs(os)) {
    location = WidgetLocation.LeftSidebar
  }

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
