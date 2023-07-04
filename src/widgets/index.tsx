import {
  AppEvents,
  declareIndexPlugin,
  ReactRNPlugin,
  RemId,
  WidgetLocation,
} from '@remnote/plugin-sdk';
import '../style.css';
import '../App.css';

async function onActivate(plugin: ReactRNPlugin) {
  // Register a sidebar widget.
  await plugin.app.registerWidget('table_of_contents', WidgetLocation.RightSidebar, {
    dimensions: { height: 'auto', width: '100%' },
  });

  plugin.event.addListener(AppEvents.GlobalOpenRem, undefined, async (message) => {
    const currentRemId = message.remId as RemId;
    await plugin.storage.setSession('toc_currentRemId', currentRemId);
  });
}

async function onDeactivate(_: ReactRNPlugin) {}

declareIndexPlugin(onActivate, onDeactivate);
