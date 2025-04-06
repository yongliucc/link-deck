import { ExternalLink, Settings } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';
import { getLinkGroups, LinkGroup } from '@/lib/api';

const Home: React.FC = () => {
  const { isAuthenticated } = useAuth();
  const [linkGroups, setLinkGroups] = useState<LinkGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchLinkGroups = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await getLinkGroups();
        setLinkGroups(data);
      } catch (err) {
        console.error('Failed to load link groups:', err);
        setError('Failed to load link groups');
      } finally {
        setLoading(false);
      }
    };

    fetchLinkGroups();
  }, []);

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900">Link Desk</h1>
          {isAuthenticated && (
            <Link to="/admin">
              <Button variant="outline" size="sm">
                <Settings className="h-4 w-4 mr-2" />
                Admin
              </Button>
            </Link>
          )}
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && (
          <div className="mb-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
            {error}
            <button 
              className="float-right font-bold"
              onClick={() => setError(null)}
            >
              &times;
            </button>
          </div>
        )}

        {loading ? (
          <div className="text-center py-8">Loading...</div>
        ) : linkGroups.length === 0 ? (
          <div className="text-center py-8 text-gray-500">No links available.</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {linkGroups
              .sort((a, b) => a.sort_order - b.sort_order)
              .map(group => (
                <Card key={group.id} className="overflow-hidden">
                  <CardHeader className="bg-gray-50">
                    <CardTitle>{group.name}</CardTitle>
                  </CardHeader>
                  <CardContent className="p-0">
                    <ul className="divide-y">
                      {(group.links || [])
                        .sort((a, b) => a.sort_order - b.sort_order)
                        .map(link => (
                          <li key={link.id} className="p-4 hover:bg-gray-50">
                            <a 
                              href={link.url} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="flex items-center justify-between text-blue-600 hover:text-blue-800"
                            >
                              <div className="flex items-center">
                                <span>{link.name}</span>
                              </div>
                              <ExternalLink className="h-4 w-4 ml-2" />
                            </a>
                          </li>
                        ))}
                    </ul>
                  </CardContent>
                </Card>
              ))}
          </div>
        )}
      </main>

      <footer className="bg-white border-t mt-auto py-4">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-gray-500 text-sm">
          <p>Link Desk &copy; {new Date().getFullYear()}</p>
        </div>
      </footer>
    </div>
  );
};

export default Home; 