import { lazy } from "react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { Provider } from "react-redux";
import { appStore } from "./utils/appStore";
import AppShell from "./components/layout/AppShell";
import RequireAuth from "./components/layout/RequireAuth";
import PublicOnly from "./components/layout/PublicOnly";
import TabLayout from "./components/layout/TabLayout";
import ScreenLayout from "./components/layout/ScreenLayout";
import Landing from "./pages/Landing";
import Login from "./pages/Login";
import Signup from "./pages/Signup";

// Logged-in screens load on demand, so the landing page stays light.
const Onboarding = lazy(() => import("./pages/Onboarding"));
const Feed = lazy(() => import("./pages/Feed"));
const Likes = lazy(() => import("./pages/Likes"));
const Chats = lazy(() => import("./pages/Chats"));
const Chat = lazy(() => import("./pages/Chat"));
const MyProfile = lazy(() => import("./pages/MyProfile"));
const EditProfile = lazy(() => import("./pages/EditProfile"));
const Settings = lazy(() => import("./pages/Settings"));
const UserProfile = lazy(() => import("./pages/UserProfile"));

function App() {
  return (
    <Provider store={appStore}>
      <BrowserRouter basename="/">
        <Routes>
          <Route element={<AppShell />}>
            {/* logged out */}
            <Route element={<PublicOnly />}>
              <Route index element={<Landing />} />
              <Route element={<ScreenLayout />}>
                <Route path="login" element={<Login />} />
                <Route path="signup" element={<Signup />} />
              </Route>
            </Route>

            {/* logged in */}
            <Route element={<RequireAuth />}>
              <Route element={<TabLayout />}>
                <Route path="feed" element={<Feed />} />
                <Route path="likes" element={<Likes />} />
                <Route path="chats" element={<Chats />} />
                <Route path="profile" element={<MyProfile />} />
                <Route path="profile/edit" element={<EditProfile />} />
                <Route path="settings" element={<Settings />} />
              </Route>
              <Route element={<ScreenLayout />}>
                <Route path="onboarding" element={<Onboarding />} />
                <Route path="chat/:userId" element={<Chat />} />
                <Route path="user/:userId" element={<UserProfile />} />
              </Route>
              {/* v1 paths */}
              <Route
                path="requests"
                element={<Navigate to="/likes" replace />}
              />
              <Route
                path="connections"
                element={<Navigate to="/chats" replace />}
              />
            </Route>

            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </Provider>
  );
}

export default App;
