<script>
  import { createEventDispatcher } from 'svelte';

  export let node;
  export let selectedRoleId = '';
  export let assignmentsByRole = {};
  export let contactsById = {};

  const dispatch = createEventDispatcher();

  $: assignedContact = contactsById[assignmentsByRole[node.id]];
  $: isVacant = !assignedContact;
  $: isSelected = selectedRoleId === node.id;
</script>

<li>
  <button
    type="button"
    class={`node level-${node.level} ${isVacant ? 'vacant' : 'staffed'} ${isSelected ? 'selected' : ''}`}
    on:click={() => dispatch('selectrole', { roleId: node.id })}
    aria-pressed={isSelected}
    title={isVacant ? `${node.name} — Vacant` : `${node.name} — ${assignedContact.name}`}
  >
    <span class="node-level-badge">{node.level.toUpperCase()}</span>
    <span class="node-role">{node.name}</span>
    {#if assignedContact}
      <span class="node-person">{assignedContact.name}</span>
      {#if assignedContact.agency}
        <span class="node-agency">{assignedContact.agency}</span>
      {/if}
      {#if assignedContact.phone}
        <span class="node-phone">{assignedContact.phone}</span>
      {/if}
    {:else}
      <span class="node-vacant-label">VACANT</span>
    {/if}
    <span class="node-status-dot" aria-hidden="true"></span>
  </button>
  {#if node.children?.length}
    <ul>
      {#each node.children as child}
        <svelte:self
          node={child}
          selectedRoleId={selectedRoleId}
          assignmentsByRole={assignmentsByRole}
          contactsById={contactsById}
          on:selectrole
        />
      {/each}
    </ul>
  {/if}
</li>

<style>
  /* ── Tree connector lines ─────────────────────────────── */
  li {
    list-style: none;
    position: relative;
    text-align: center;
    padding: 1rem .5rem 0;
  }
  li::before, li::after {
    content: '';
    position: absolute;
    top: 0;
    right: 50%;
    border-top: 2px solid rgba(0, 210, 255, 0.45);
    width: 50%;
    height: 1rem;
  }
  li::after {
    right: auto;
    left: 50%;
    border-left: 2px solid rgba(0, 210, 255, 0.45);
  }
  li:only-child::before, li:only-child::after { display: none; }
  li:only-child { padding-top: 0; }
  li:first-child::before, li:last-child::after { border: 0; }
  li:last-child::before {
    border-right: 2px solid rgba(0, 210, 255, 0.45);
    border-radius: 0 5px 0 0;
  }
  li:first-child::after { border-radius: 5px 0 0 0; }

  ul {
    display: flex;
    justify-content: center;
    margin: 0;
    padding: 1.1rem 0 0;
    position: relative;
  }
  ul::before {
    content: '';
    position: absolute;
    top: 0;
    left: 50%;
    border-left: 2px solid rgba(0, 210, 255, 0.45);
    width: 0;
    height: 1rem;
  }

  /* ── Node base ────────────────────────────────────────── */
  .node {
    position: relative;
    display: inline-flex;
    flex-direction: column;
    align-items: flex-start;
    gap: 0;
    min-width: 190px;
    max-width: 240px;
    padding: .65rem .75rem .55rem;
    border-radius: 6px;
    font-size: .82rem;
    color: #e8f4ff;
    cursor: pointer;
    text-align: left;
    border: 1px solid rgba(255,255,255,.10);
    background: #0d1b2a;
    box-shadow: 0 2px 10px rgba(0,0,0,.45);
    transition: border-color .12s, box-shadow .12s, transform .1s;
  }
  .node:hover {
    border-color: rgba(0,210,255,.5);
    box-shadow: 0 0 0 1px rgba(0,210,255,.3), 0 4px 16px rgba(0,0,0,.55);
    transform: translateY(-1px);
  }

  /* ── Level colors — left accent bar ──────────────────── */
  .node::before {
    content: '';
    position: absolute;
    left: 0;
    top: 0;
    bottom: 0;
    width: 4px;
    border-radius: 6px 0 0 6px;
  }
  .level-command::before  { background: #f5c400; }
  .level-section::before  { background: #00b87a; }
  .level-branch::before   { background: #2196f3; }
  .level-unit::before     { background: #e6721a; }

  /* ── Level badge ──────────────────────────────────────── */
  .node-level-badge {
    font-size: .58rem;
    font-weight: 700;
    letter-spacing: .09em;
    opacity: .5;
    margin-bottom: .2rem;
  }
  .level-command .node-level-badge  { color: #f5c400; opacity: .8; }
  .level-section .node-level-badge  { color: #00e89a; opacity: .8; }
  .level-branch .node-level-badge   { color: #64b5f6; opacity: .8; }
  .level-unit .node-level-badge     { color: #ffb04d; opacity: .8; }

  /* ── Role name ────────────────────────────────────────── */
  .node-role {
    font-weight: 700;
    font-size: .84rem;
    line-height: 1.3;
    color: #ddeeff;
    padding-left: .1rem;
  }

  /* ── Person info ──────────────────────────────────────── */
  .node-person {
    font-size: .82rem;
    font-weight: 600;
    color: #a8d8ff;
    margin-top: .25rem;
    padding-left: .1rem;
  }
  .node-agency {
    font-size: .72rem;
    color: #7a9cbf;
    padding-left: .1rem;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    max-width: 210px;
  }
  .node-phone {
    font-size: .72rem;
    color: #6eb0d8;
    padding-left: .1rem;
    font-variant-numeric: tabular-nums;
  }

  /* ── Vacant label ─────────────────────────────────────── */
  .node-vacant-label {
    font-size: .7rem;
    font-weight: 700;
    letter-spacing: .1em;
    color: #ff6b6b;
    margin-top: .22rem;
    padding-left: .1rem;
    opacity: .9;
  }

  /* ── Status dot (top-right corner) ───────────────────── */
  .node-status-dot {
    position: absolute;
    top: .45rem;
    right: .5rem;
    width: 8px;
    height: 8px;
    border-radius: 50%;
  }
  .staffed .node-status-dot {
    background: #00e89a;
    box-shadow: 0 0 6px rgba(0, 232, 154, .7);
  }
  .vacant .node-status-dot {
    background: #ff4444;
    box-shadow: 0 0 6px rgba(255, 68, 68, .7);
    animation: pulse-dot 1.8s ease-in-out infinite;
  }
  @keyframes pulse-dot {
    0%, 100% { opacity: 1; box-shadow: 0 0 6px rgba(255,68,68,.7); }
    50%       { opacity: .5; box-shadow: 0 0 12px rgba(255,68,68,.4); }
  }

  /* ── Vacant node styling ──────────────────────────────── */
  .vacant {
    opacity: .75;
    background: #0a141e;
    border-style: dashed;
    border-color: rgba(255, 100, 100, .22);
  }
  .vacant:hover {
    opacity: 1;
    border-color: rgba(255, 100, 100, .6);
    box-shadow: 0 0 0 1px rgba(255,100,100,.3), 0 4px 16px rgba(0,0,0,.55);
  }

  /* ── Selected node ────────────────────────────────────── */
  .selected {
    border-color: #00d2ff !important;
    border-style: solid !important;
    opacity: 1 !important;
    box-shadow: 0 0 0 2px rgba(0,210,255,.35), 0 4px 20px rgba(0,0,0,.6) !important;
  }

  /* ── Level-specific backgrounds for command/section ────── */
  .level-command {
    min-width: 220px;
    background: #12200e;
    border-color: rgba(245, 196, 0, .2);
  }
  .level-section {
    background: #0d1a25;
    border-color: rgba(0, 184, 122, .18);
  }
</style>
