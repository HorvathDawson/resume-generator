

export const NameTemplates = {
  standard: {
    id: 'name-standard',
    name: 'Standard Name',
    description: 'Standard name display',
    component: ({ section }: { section: any }) => {
      const fullName = section.content?.fullName || section.content?.name || section.items?.[0]?.content?.fullName || section.items?.[0]?.title || 'Name';
      return (
        <div className="name">
          <h1>{fullName}</h1>
        </div>
      );
    }
  },
  
  centered: {
    id: 'name-centered',
    name: 'Centered Name',
    description: 'Centered name display',
    component: ({ section }: { section: any }) => {
      const fullName = section.content?.fullName || section.content?.name || section.items?.[0]?.content?.fullName || section.items?.[0]?.title || 'Name';
      return (
        <div className="name centered">
          <h1>{fullName}</h1>
        </div>
      );
    }
  }
};