import { Redirect } from "expo-router";

import GalleryScreen from "../../gallery/GalleryScreen";

export default function GalleryRoute() {
  return __DEV__ ? <GalleryScreen /> : <Redirect href="/" />;
}
