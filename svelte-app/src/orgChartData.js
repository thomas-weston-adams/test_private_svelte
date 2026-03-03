const baseOrgChart = {
  name: 'SEOC Manager',
  level: 'command',
  children: [
    { name: 'Safety', level: 'section' },
    { name: 'Liaison', level: 'section' },
    { name: 'ESF 15 Public Information', level: 'section' },
    {
      name: 'Operations Section Chief',
      level: 'section',
      children: [
        {
          name: 'Health Service Branch',
          level: 'branch',
          children: [
            { name: 'ESF 6 Mass Care, Housing, & Human Services', level: 'unit' },
            { name: 'ESF 8 Public Health & Medical Services', level: 'unit' },
            { name: 'ESF 11 Agriculture', level: 'unit' }
          ]
        },
        {
          name: 'Infrastructure Branch',
          level: 'branch',
          children: [
            { name: 'ESF 1 Transportation', level: 'unit' },
            { name: 'ESF 3 Public Works & Engineering', level: 'unit' },
            { name: 'ESF 12 Energy & Utilities', level: 'unit' },
            { name: 'ESF 17 Cyber Security', level: 'unit' }
          ]
        },
        {
          name: 'Public Safety Branch',
          level: 'branch',
          children: [
            { name: 'ESF 4 Firefighting', level: 'unit' },
            { name: 'ESF 9 Search & Rescue', level: 'unit' },
            { name: 'ESF 10 Hazardous Materials', level: 'unit' },
            { name: 'ESF 13 Law Enforcement & Security', level: 'unit' }
          ]
        }
      ]
    },
    {
      name: 'Planning Section Chief',
      level: 'section',
      children: [
        {
          name: 'Resource Unit',
          level: 'branch',
          children: [
            { name: 'Documentation Unit', level: 'branch' },
            { name: 'Situation Unit', level: 'branch' },
            { name: 'Hazard Analysis', level: 'branch' },
            { name: 'Information Technology (IT)', level: 'branch' },
            { name: 'Geographic Information System (GIS)', level: 'branch' }
          ]
        }
      ]
    },
    {
      name: 'Logistics',
      level: 'section',
      children: [
        {
          name: 'Supply Branch',
          level: 'branch',
          children: [
            { name: 'Donations Manager', level: 'unit' },
            { name: 'Ordering Manager', level: 'unit' },
            { name: 'Receiving & Distribution Manager', level: 'unit' }
          ]
        },
        {
          name: 'Support Branch',
          level: 'branch',
          children: [
            { name: 'ESF 2 Communications', level: 'unit' },
            { name: 'Private Sector EOC Representative', level: 'unit' },
            { name: 'Volunteer Manager', level: 'unit' },
            { name: 'Information Technology (IT)', level: 'unit' },
            { name: 'Geographic Information System (GIS)', level: 'unit' }
          ]
        }
      ]
    },
    {
      name: 'Recovery',
      level: 'section',
      children: [
        {
          name: 'Individual Assistance',
          level: 'branch',
          children: [
            { name: 'Public Assistance', level: 'branch' },
            { name: 'Mitigation', level: 'branch' },
            { name: 'Commonwealth Council for Recovery & Resilience', level: 'branch' }
          ]
        }
      ]
    },
    { name: 'Admin/Finance', level: 'section' }
  ]
};

const slug = (value) => value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

const withIds = (node, lineage = []) => {
  const id = ['role', ...lineage, slug(node.name)].join('__');
  return {
    ...node,
    id,
    children: node.children?.map((child) => withIds(child, [...lineage, slug(node.name)])) || []
  };
};

export const orgChart = withIds(baseOrgChart);

export const defaultMasterContacts = [
  {
    id: 'contact-jane-doe',
    name: 'Jane Doe',
    agency: 'KYEM',
    title: 'SEOC Duty Officer',
    email: 'jane.doe@example.org',
    phone: '502-555-0100'
  },
  {
    id: 'contact-john-smith',
    name: 'John Smith',
    agency: 'KY National Guard',
    title: 'Liaison Officer',
    email: 'john.smith@example.org',
    phone: '502-555-0111'
  }
];

export const defaultAssignments = {
  'role__seoc-manager': 'contact-jane-doe',
  'role__liaison': 'contact-john-smith'
};
