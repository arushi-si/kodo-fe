import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { Provider } from "react-redux";
import "./App.css";
import { appStore } from "./utils/appStore";
import Body from "./components/Body";
import RequireAuth from "./components/RequireAuth";
import PublicOnly from "./components/PublicOnly";
import Login from "./components/Login";
import Signup from "./components/Signup";
import Feed from "./components/Feed";
import Profile from "./components/Profile";
import Settings from "./components/Settings";
import Requests from "./components/Requests";
import Connections from "./components/Connections";
import PublicProfile from "./components/PublicProfile";
import Chats from "./components/Chats";
import Chat from "./components/Chat";

function App() {
  return (
    <Provider store={appStore}>
      <BrowserRouter basename="/">
        <Routes>
          <Route path="/" element={<Body />}>
            <Route element={<PublicOnly />}>
              <Route path="login" element={<Login />} />
            </Route>
            <Route path="signup" element={<Signup />} />
            <Route element={<RequireAuth />}>
              <Route index element={<Navigate to="/feed" replace />} />
              <Route path="feed" element={<Feed />} />
              <Route path="profile" element={<Profile />} />
              <Route path="settings" element={<Settings />} />
              <Route path="requests" element={<Requests />} />
              <Route path="connections" element={<Connections />} />
              <Route path="user/:userId" element={<PublicProfile />} />
              <Route path="chats" element={<Chats />} />
              <Route path="chat/:userId" element={<Chat />} />
            </Route>
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </Provider>
  );
}

export default App;
