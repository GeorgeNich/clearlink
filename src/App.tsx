import { Button } from './components';
import { useIsPhone } from './hooks/useIsPhone';
import { CameraBlocked } from './screens/CameraBlocked';
import { CameraCheck } from './screens/CameraCheck';
import { Call } from './screens/Call';
import { Ended } from './screens/Ended';
import { Loading } from './screens/Loading';
import { Message } from './screens/Message';
import { Welcome } from './screens/Welcome';
import { useApp } from './state/useApp';

export function App() {
  const [st, a] = useApp();
  const phone = useIsPhone();
  let screen;
  switch (st.route) {
    case 'welcome': screen = <Welcome st={st} a={a} phone={phone} />; break;
    case 'check': screen = <CameraCheck st={st} a={a} phone={phone} />; break;
    case 'blocked': screen = <CameraBlocked st={st} a={a} />; break;
    case 'validating':
    case 'connecting': screen = <Loading st={st} a={a} />; break;
    case 'ended': screen = <Ended st={st} a={a} />; break;
    case 'call': screen = <Call st={st} a={a} phone={phone} />; break;
    case 'cannot':
      screen = (
        <Message title="We couldn’t connect"
          actions={<><Button block size="phone" onClick={a.retryConnect}>Try again</Button><Button block variant="secondary" onClick={a.goHome}>Home</Button></>}>
          Check your internet connection and try again. Your name and camera choices are kept.
        </Message>
      );
      break;
    case 'notfound':
      screen = (
        <Message title="We can’t find that room" actions={<Button block size="phone" onClick={a.goHome}>Try another code</Button>}>
          Check the code <strong className="tracking-caps text-fg">{st.pendingCode}</strong> with whoever invited you. Rooms close when everyone has left.
        </Message>
      );
      break;
    case 'full':
      screen = (
        <Message title="This room is full"
          actions={<><Button block size="phone" onClick={() => void a.openInvite(st.pendingCode, st.rejoining)}>Try again</Button><Button block variant="secondary" onClick={a.goHome}>Home</Button></>}>
          Five people are already in this room, which is the limit. Try again when someone leaves.
        </Message>
      );
      break;
  }

  return (
    <div className="cl-root relative h-full w-full overflow-hidden">
      {screen}
    </div>
  );
}
