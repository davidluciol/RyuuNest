import LibraryScreen from "../../screens/library/LibraryScreen";
import { SAMPLE_LIBRARY_DATA } from "../../screens/library/libraryFixtures";

export default function LibraryRoute() {
  return <LibraryScreen data={SAMPLE_LIBRARY_DATA} />;
}
