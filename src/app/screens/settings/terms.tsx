import React from 'react';

import { getTermsConditionsPage } from '../../../api/content-pages/content-pages.api';
import { ContentPageScreen } from '../../../components/settings/ContentPageScreen';

export default function TermsScreen() {
  return <ContentPageScreen title="Terms of service" loadPage={getTermsConditionsPage} />;
}
