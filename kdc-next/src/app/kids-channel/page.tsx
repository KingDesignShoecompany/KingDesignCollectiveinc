import Link from 'next/link';
import PageFrame from '../../components/PageFrame';
import GlassCard from '../../components/GlassCard';
import HeroBanner from '../../components/HeroBanner';
import { STORIES } from '../../data/stories';

const totalViews = STORIES.reduce((n, s) => n + parseFloat(s.views), 0).toFixed(1);

export default function KidsChannelPage() {
  return (
    <>
      <HeroBanner kind="cards" title="Kids Channel" subtitle="Seven Minute Story Sessions" badge="Safe Mode: ON" />
      <PageFrame title="Library" subtitle="Seven Minute Story Sessions in a unified theme">
      <div className="card-grid">
        <Link href="/KingDesignCollectiveinc/stories/" style={{ textDecoration: 'none', color: 'inherit' }}>
          <GlassCard corner="KDCI" hero="📚" title="Story Library" meta={`${STORIES.length} bedtime stories with read-along`}
            stats={[['Stories', String(STORIES.length)], ['Views', totalViews + 'K'], ['Rating', '9.7']]} thumbs={['Animals', 'Fantasy', 'Adventure']} progress={100} />
        </Link>
        <GlassCard corner="KDCI" hero="🎧" title="Story Player" meta="Read-along with chapters and progress"
          stats={[['Minutes', '7'], ['Voices', '4'], ['Ambient', '5']]} thumbs={['Read', 'Chapters', 'Play']} progress={84} />
        <GlassCard corner="KDCI" hero="✏️" title="Create" meta="Build custom stories for kids"
          stats={[['Paths', '50+'], ['Safe', 'ON'], ['Age', '2-8']]} thumbs={['Learning', 'Stories', 'Create']} progress={60} />
      </div>
      </PageFrame>
    </>
  );
}
