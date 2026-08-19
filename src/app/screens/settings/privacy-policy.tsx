import React from 'react';

import { getPrivacyPolicyPage } from '../../../api/content-pages/content-pages.api';
import { ContentPageScreen } from '../../../components/settings/ContentPageScreen';

export default function PrivacyPolicyScreen() {
  return <ContentPageScreen title="Privacy Policy" loadPage={getPrivacyPolicyPage} />;
}
