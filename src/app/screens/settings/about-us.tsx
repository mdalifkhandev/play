import React from 'react';

import { getAboutUsPage } from '../../../api/content-pages/content-pages.api';
import { ContentPageScreen } from '../../../components/settings/ContentPageScreen';

export default function AboutUsScreen() {
  return <ContentPageScreen title="About Us" loadPage={getAboutUsPage} />;
}
