import { useState } from "react";
import { router, useLocalSearchParams } from "expo-router";

import SeriesScreen from "../../../../screens/series/SeriesScreen";
import { preferredRelease, sampleSeriesView } from "../../../../screens/series/seriesFixtures";

export default function SeriesRoute() {
  const { moduleId, seriesId } = useLocalSearchParams<{ moduleId: string; seriesId: string }>();
  const [favorite, setFavorite] = useState(false);
  const [preferredReleaseId, setPreferredReleaseId] = useState<string | null>(null);
  const base = sampleSeriesView(seriesId);
  const data = { ...base, moduleName: moduleId, preferredReleaseId };

  return (
    <SeriesScreen
      data={data}
      favorite={favorite}
      onBack={() => router.back()}
      onFavoriteToggle={() => setFavorite((value) => !value)}
      onFolderLongPress={() => undefined}
      onReleaseSelect={(chapterId, releaseId) => {
        const chapter = data.details.chapters.find((item) => item.id === chapterId);
        if (chapter !== undefined && preferredRelease(chapter.releases, releaseId)?.id === releaseId) {
          setPreferredReleaseId(releaseId);
        }
      }}
    />
  );
}
