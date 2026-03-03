<script>
  import { createEventDispatcher } from 'svelte';

  export let node;
  export let selectedRoleId = '';
  export let assignmentsByRole = {};
  export let contactsById = {};
  export let viewMode = 'landscape';

  const dispatch = createEventDispatcher();

  const levelClass = {
    command: 'command',
    section: 'section',
    branch: 'branch',
    unit: 'unit'
  };

  $: assignedContact = contactsById[assignmentsByRole[node.id]];
</script>

<li>
  <button
    type="button"
    class={`node ${levelClass[node.level] || 'unit'} ${selectedRoleId === node.id ? 'selected' : ''}`}
    on:click={() => dispatch('selectrole', { roleId: node.id })}
    aria-pressed={selectedRoleId === node.id}
  >
    <span class="role-name">{node.name}</span>
    {#if assignedContact}
      <span class="assigned-name">{assignedContact.name}</span>
      <span class="assigned-contact">{assignedContact.phone}</span>
    {:else}
      <span class="assigned-name vacant">Vacant</span>
    {/if}
  </button>
  {#if node.children?.length}
    <ul class:portrait={viewMode === 'portrait'}>
      {#each node.children as child}
        <svelte:self
          node={child}
          selectedRoleId={selectedRoleId}
          assignmentsByRole={assignmentsByRole}
          contactsById={contactsById}
          viewMode={viewMode}
          on:selectrole
        />
      {/each}
    </ul>
  {/if}
</li>

<style>
  li { list-style: none; position: relative; text-align: center; padding: .75rem .25rem 0; }
  li::before, li::after { content: ''; position: absolute; top: 0; right: 50%; border-top: 2px solid #8bbf7a; width: 50%; height: .75rem; }
  li::after { right: auto; left: 50%; border-left: 2px solid #8bbf7a; }
  li:only-child::before, li:only-child::after { display: none; }
  li:only-child { padding-top: 0; }
  li:first-child::before, li:last-child::after { border: 0; }
  li:last-child::before { border-right: 2px solid #8bbf7a; border-radius: 0 5px 0 0; }
  li:first-child::after { border-radius: 5px 0 0 0; }

  ul { display: flex; justify-content: center; margin: 0; padding: .95rem 0 0; position: relative; }
  ul.portrait { flex-wrap: wrap; max-width: 900px; margin: 0 auto; gap: .35rem; }
  ul::before { content: ''; position: absolute; top: 0; left: 50%; border-left: 2px solid #8bbf7a; width: 0; height: .75rem; }

  .node {
    display: inline-flex;
    flex-direction: column;
    gap: .2rem;
    min-width: 170px;
    max-width: 220px;
    padding: 0.6rem;
    border-radius: 8px;
    font-size: .92rem;
    color: #f8fafc;
    border: 2px solid transparent;
    box-shadow: 0 2px 8px rgba(0, 0, 0, .16);
    cursor: pointer;
    text-align: center;
  }

  .role-name { font-weight: 800; line-height: 1.2; }
  .assigned-name { font-weight: 600; }
  .assigned-name.vacant { opacity: .9; font-style: italic; }
  .assigned-contact { font-size: .8rem; opacity: .98; }

  .selected { border-color: #111827; box-shadow: 0 0 0 2px #fff, 0 0 0 4px #111827; }
  .command { background: #f9d24b; color: #111827; }
  .section { background: #2f7d32; color: #ffffff; text-shadow: 0 1px 0 rgba(0,0,0,.35); }
  .branch { background: #1f5f97; color: #ffffff; text-shadow: 0 1px 0 rgba(0,0,0,.35); }
  .unit { background: #b85d10; color: #ffffff; text-shadow: 0 1px 0 rgba(0,0,0,.35); }
</style>
