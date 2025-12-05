interface NavbarProps {
  selectedCategory: string;
  onCategoryChange: (category: string) => void;
}

const Navbar = ({ selectedCategory, onCategoryChange }: NavbarProps) => {
  const categories = [
    { id: 'all', name: 'Genel', icon: '🏠' },
    { id: 'Kadın Giyim', name: 'Kadın', icon: '👗' },
    { id: 'Erkek Giyim', name: 'Erkek', icon: '👔' }
  ];

  return (
    <nav style={{ 
      backgroundColor: 'white', 
      boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)', 
      borderBottom: '1px solid #e5e7eb',
      padding: '0 1rem'
    }}>
      <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '0 1rem' }}>
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          height: '4rem' 
        }}>
          {/* Logo/Brand */}
          <div>
            <h1 style={{ 
              fontSize: '1.25rem', 
              fontWeight: 'bold', 
              color: '#111827',
              margin: 0
            }}>
              Looksy
            </h1>
          </div>
          
          {/* Category Filter */}
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            {categories.map((category) => (
              <button
                key={category.id}
                onClick={() => onCategoryChange(category.id)}
                style={{
                  backgroundColor: selectedCategory === category.id ? '#3b82f6' : '#f3f4f6',
                  color: selectedCategory === category.id ? 'white' : '#6b7280',
                  border: 'none',
                  padding: '0.5rem 1rem',
                  borderRadius: '0.5rem',
                  cursor: 'pointer',
                  fontSize: '0.875rem',
                  fontWeight: '500',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.25rem',
                  transition: 'all 0.2s ease'
                }}
              >
                <span>{category.icon}</span>
                {category.name}
              </button>
            ))}
          </div>
          
          {/* User Avatar */}
          <div>
            <button style={{
              backgroundColor: '#f3f4f6',
              border: 'none',
              borderRadius: '50%',
              padding: '0.5rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <svg 
                style={{ width: '1.5rem', height: '1.5rem', color: '#6b7280' }}
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={2} 
                  d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" 
                />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
