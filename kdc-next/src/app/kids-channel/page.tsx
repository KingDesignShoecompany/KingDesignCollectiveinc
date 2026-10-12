import PageFrame from '../../components/PageFrame';
import GlassCard from '../../components/GlassCard';

export default function KidsChannelPage() {
  return (
    <PageFrame title="Kids Channel" subtitle="Seven Minute Story Sessions in a unified theme" badge="Safe Mode: ON">
      <div className="card-grid">
        <GlassCard corner="KDCI" hero="📚" title="Story Library" meta="Bedtime stories with audio read-along"
          stats={[['Stories', '8'], ['Minutes', '7'], ['Age', '2-8']]} thumbs={['Moonbear', 'Mermaid', 'Starlight']} progress={100} />
        <GlassCard corner="KDCI" hero="🎬" title="Episodes" meta="Animated sessions with narration"
          stats={[['Episodes', '50+'], ['Voices', '4'], ['Ambient', '5']]} thumbs={['Characters', 'Arcs', 'Themes']} progress={72} />
        <GlassCard corner="KDCI" hero="✏️" title="Create" meta="Build custom stories for kids"
          stats={[['Paths', '50+'], ['Safe', 'ON'], ['Rating', '9.7']]} thumbs={['Learning', 'Stories', 'Create']} progress={60} />
      </div>
    </PageFrame>
  );
}
