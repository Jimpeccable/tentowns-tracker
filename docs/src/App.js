import * as d3 from 'https://cdn.jsdelivr.net/npm/d3@7/+esm';
import React, { useState, useEffect } from 'https://cdn.jsdelivr.net/npm/react@18.2.0/+esm';
import ReactDOM from 'https://cdn.jsdelivr.net/npm/react-dom@18.2.0/+esm';

const App = () => {
  const [town, setTown] = useState('Bryn Shander');
  const [tab, setTab] = useState('npcs');
  const [data, setData] = useState({ npcs: [], events: [], rumours: [], sacrifices: [], factions: [] });
  const [playerAction, setPlayerAction] = useState('');
  const [chapter, setChapter] = useState(1);
  const [moodScene, setMoodScene] = useState('Tundra');

  // Fetch town data
  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch(`src/data/${town.toLowerCase().replace(' ', '_')}.json`);
        const json = await response.json();
        setData({
          npcs: json.npcs || [],
          events: json.events || [],
          rumours: json.rumours || [],
          sacrifices: json.sacrifices || [],
          factions: json.factions || []
        });
      } catch (error) {
        console.error('Error fetching data:', error);
      }
    };
    fetchData();
  }, [town]);

  // Render NPC relationship web
  useEffect(() => {
    if (tab !== 'npcs') return;
    d3.select('#relationship-web').selectAll('*').remove();
    const width = 800, height = 600;
    const svg = d3.select('#relationship-web').append('svg')
      .attr('width', width)
      .attr('height', height);

    const simulation = d3.forceSimulation(data.npcs)
      .force('link', d3.forceLink(data.npcs.flatMap(n => n.relationships || []).map(r => ({
        source: r.source,
        target: r.target,
        type: r.type
      }))).id(d => d.name))
      .force('charge', d3.forceManyBody().strength(-50))
      .force('center', d3.forceCenter(width / 2, height / 2));

    const link = svg.append('g')
      .selectAll('line')
      .data(data.npcs.flatMap(n => n.relationships || []))
      .enter().append('line')
      .attr('stroke', d => d.type === 'rivalry' ? 'red' : 'green')
      .attr('stroke-width', 2);

    const node = svg.append('g')
      .selectAll('g')
      .data(data.npcs)
      .enter().append('g');

    node.append('circle')
      .attr('r', 8)
      .attr('fill', d => d.role === 'Speaker' ? 'blue' : d.role === 'Merchant' ? 'gray' : 'purple');

    node.append('text')
      .attr('dx', 12)
      .attr('dy', '.35em')
      .text(d => d.name)
      .style('font-size', '12px')
      .style('fill', '#fff');

    node.append('title').text(d => `Motivation: ${d.motivation}\nSecret: ${d.secret}`);

    simulation.on('tick', () => {
      link
        .attr('x1', d => d.source.x)
        .attr('y1', d => d.source.y)
        .attr('x2', d => d.target.x)
        .attr('y2', d => d.target.y);
      node
        .attr('transform', d => `translate(${d.x},${d.y})`);
    });
  }, [tab, data.npcs]);

  // Handle player action
  const handlePlayerAction = () => {
    if (!playerAction) return;
    const newEvent = {
      id: `event_${Math.random()}`,
      description: `Triggered by: ${playerAction}`,
      consequences: 'Town morale shifts; new quest available.',
      roleplay_prompt: `The townsfolk react to your action: ${playerAction.toLowerCase()}.`
    };
    setData(prev => ({
      ...prev,
      events: [...prev.events, newEvent]
    }));
    // Update faction influence (mock example)
    setData(prev => ({
      ...prev,
      factions: prev.factions.map(f => ({
        ...f,
        influence: playerAction.toLowerCase().includes(f.name.toLowerCase()) ? f.influence + 10 : f.influence
      }))
    }));
    setPlayerAction('');
  };

  // Export to Foundry VTT
  const exportToFoundry = () => {
    const compendium = {
      town,
      npcs: data.npcs,
      events: data.events,
      rumours: data.rumours,
      sacrifices: data.sacrifices,
      factions: data.factions
    };
    const blob = new Blob([JSON.stringify(compendium, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${town}_compendium.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Mood Generator data
  const moods = [
    { scene: 'Tundra', audio: 'assets/mood/blizzard.mp3', image: 'assets/mood/tundra.png' },
    { scene: 'Tavern', audio: 'assets/mood/tavern_ambience.mp3', image: 'assets/mood/tavern.png' },
    { scene: 'Auril Temple', audio: 'assets/mood/auril_chant.mp3', image: 'assets/mood/auril_temple.png' }
  ];

  return (
    <div className="container mt-4">
      <h1 className="mb-4">Ten-Towns Dynamic Tracker</h1>
      <div className="mb-3">
        <label className="form-label">Select Town:</label>
        <select className="form-select" value={town} onChange={(e) => setTown(e.target.value)}>
          <option value="Bryn Shander">Bryn Shander</option>
          <option value="Easthaven">Easthaven</option>
        </select>
      </div>
      <div className="mb-3">
        <label className="form-label">Campaign Chapter:</label>
        <select className="form-select" value={chapter} onChange={(e) => setChapter(Number(e.target.value))}>
          {[1, 2, 3, 4, 5].map(c => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>
      <ul className="nav nav-tabs mb-3">
        {['npcs', 'events', 'rumours', 'sacrifices', 'factions', 'mood'].map(t => (
          <li key={t} className="nav-item">
            <button
              className={`nav-link ${tab === t ? 'active' : ''}`}
              onClick={() => setTab(t)}
            >
              {t.charAt(0).toUpperCase() + t.slice(1)}
            </button>
          </li>
        ))}
      </ul>
      {tab === 'npcs' && (
        <div>
          <h3>NPC Relationship Web</h3>
          <div id="relationship-web" className="mb-3"></div>
        </div>
      )}
      {tab === 'events' && (
        <div>
          <h3>Events</h3>
          <ul className="list-group mb-3">
            {data.events.map(event => (
              <li key={event.id} className="list-group-item">
                <strong>{event.description}</strong><br />
                <small>Consequences: {event.consequences}</small><br />
                <small>Roleplay: {event.roleplay_prompt}</small>
              </li>
            ))}
          </ul>
        </div>
      )}
      {tab === 'rumours' && (
        <div>
          <h3>Rumours</h3>
          <ul className="list-group mb-3">
            {data.rumours.filter(r => r.chapter <= chapter).map(rumour => (
              <li key={rumour.id} className="list-group-item">
                {rumour.text}<br />
                <small>Chapter: {rumour.chapter}</small>
              </li>
            ))}
          </ul>
        </div>
      )}
      {tab === 'sacrifices' && (
        <div>
          <h3>Sacrifices</h3>
          <ul className="list-group mb-3">
            {data.sacrifices.map(s => (
              <li key={s.id} className="list-group-item">
                <strong>{s.sacrifice}</strong>: {s.consequences}<br />
                <small>Hook: {s.hooks}</small>
              </li>
            ))}
          </ul>
        </div>
      )}
      {tab === 'factions' && (
        <div>
          <h3>Faction Influence</h3>
          <ul className="list-group mb-3">
            {data.factions.map(f => (
              <li key={f.id} className="list-group-item">
                <strong>{f.name}</strong>: Influence {f.influence}%<br />
                <small>Consequences: {f.consequences}</small>
              </li>
            ))}
          </ul>
        </div>
      )}
      {tab === 'mood' && (
        <div>
          <h3>Mood Generator</h3>
          <select className="form-select mb-3" value={moodScene} onChange={(e) => setMoodScene(e.target.value)}>
            {moods.map(m => <option key={m.scene} value={m.scene}>{m.scene}</option>)}
          </select>
          <div>
            <audio controls src={moods.find(m => m.scene === moodScene)?.audio} className="mb-3"></audio>
            <img
              src={moods.find(m => m.scene === moodScene)?.image}
              alt={moodScene}
              className="img-fluid"
              style={{ maxHeight: '300px' }}
            />
          </div>
        </div>
      )}
      <div className="mt-3">
        <h3>Player Action</h3>
        <input
          type="text"
          className="form-control mb-2"
          placeholder="Enter player action (e.g., Expose Naerth)"
          value={playerAction}
          onChange={(e) => setPlayerAction(e.target.value)}
        />
        <button className="btn btn-primary" onClick={handlePlayerAction}>
          Submit Action
        </button>
      </div>
      <button className="btn btn-secondary mt-3" onClick={exportToFoundry}>
        Export to Foundry VTT
      </button>
    </div>
  );
};

ReactDOM.render(<App />, document.getElementById('root'));
