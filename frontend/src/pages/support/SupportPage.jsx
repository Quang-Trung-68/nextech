import { useState } from 'react';
import SupportHero from './components/SupportHero';
import SupportTopics from './components/SupportTopics';
import SupportFAQ from './components/SupportFAQ';
import SupportPolicies from './components/SupportPolicies';
import SupportContact from './components/SupportContact';

export default function SupportPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('order');

  return (
    <main>
      <SupportHero searchQuery={searchQuery} onSearch={setSearchQuery} />
      <SupportTopics onTabChange={(tab) => { setActiveTab(tab); setSearchQuery(''); }} />
      <SupportFAQ
        searchQuery={searchQuery}
        activeTab={activeTab}
        onTabChange={setActiveTab}
      />
      <SupportPolicies />
      <SupportContact />
    </main>
  );
}
