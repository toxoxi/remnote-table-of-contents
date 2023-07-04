import {
  renderWidget,
  usePlugin,
  useRunAsync,
  useSessionStorageState,
  RemId,
} from '@remnote/plugin-sdk';
import { generateContents } from '../lib/utils';

export const TableOfContentsWidget = () => {
  const plugin = usePlugin();
  const [remId, _] = useSessionStorageState<RemId | undefined>('toc_currentRemId', undefined);
  useRunAsync(async () => {
    const rem = await plugin.rem.findOne(remId);
    if (!rem) return;

    const contents = await generateContents(rem, plugin);
    console.log('contents', contents);
  }, [remId]);

  return (
    <div className="p-2 m-2 rounded-lg rn-clr-background-light-positive rn-clr-content-positive">
      <h1 className="text-xl">Sample Plugin</h1>
      <div></div>
    </div>
  );
};

renderWidget(TableOfContentsWidget);
