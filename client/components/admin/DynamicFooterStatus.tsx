import React, { useState, useEffect } from 'react';
import { Check, Globe, RefreshCw, Eye, ExternalLink, MapPin, Users, FileText } from 'lucide-react';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';

interface FooterStatus {
  pages: number;
  publishedPages: number;
  footerLinks: number;
  activeLinks: number;
  settings: boolean;
  locations: number;
  socialLinks: number;
  lastUpdated: string;
}

export default function DynamicFooterStatus() {
  const [status, setStatus] = useState<FooterStatus>({
    pages: 0,
    publishedPages: 0,
    footerLinks: 0,
    activeLinks: 0,
    settings: false,
    locations: 0,
    socialLinks: 0,
    lastUpdated: ''
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchStatus();
  }, []);

  const fetchStatus = async (silent = false) => {
    try {
      if (!silent) setLoading(true);
      setRefreshing(!silent);

      const [pagesRes, linksRes, settingsRes] = await Promise.all([
        fetch('/api/content/pages'),
        fetch('/api/footer/links'),
        fetch('/api/footer/settings')
      ]);

      const [pages, links, settings] = await Promise.all([
        pagesRes.json(),
        linksRes.json(),
        settingsRes.json()
      ]);

      if (pages.success && links.success && settings.success) {
        const publishedPages = pages.data.filter(p => p.status === 'published');
        const activeLinks = links.data.filter(l => l.isActive);
        
        setStatus({
          pages: pages.data.length,
          publishedPages: publishedPages.length,
          footerLinks: links.data.length,
          activeLinks: activeLinks.length,
          settings: !!settings.data,
          locations: settings.data?.locations?.length || 0,
          socialLinks: Object.keys(settings.data?.socialLinks || {}).length,
          lastUpdated: new Date().toISOString()
        });
      }
    } catch (error) {
      console.error('Error fetching footer status:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const triggerFooterRefresh = () => {
    console.log('🔄 Manually triggering footer refresh');
    window.dispatchEvent(new CustomEvent('footerUpdate'));
    fetchStatus(true);
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
            <div className="space-y-3">
              <div className="h-3 bg-gray-200 rounded"></div>
              <div className="h-3 bg-gray-200 rounded w-5/6"></div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Globe className="h-5 w-5 text-[#C70000]" />
            <span>Dynamic Footer Status</span>
          </div>
          <Button
            onClick={triggerFooterRefresh}
            variant="outline"
            size="sm"
            disabled={refreshing}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* System Status */}
        <div className="flex items-center space-x-2 p-3 bg-green-50 border border-green-200 rounded-lg">
          <Check className="h-5 w-5 text-green-600" />
          <span className="text-green-800 font-medium">Dynamic Footer System Active</span>
          <Badge className="ml-auto bg-green-100 text-green-800">Live</Badge>
        </div>

        {/* Statistics Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center p-3 bg-blue-50 rounded-lg">
            <FileText className="h-6 w-6 text-blue-600 mx-auto mb-2" />
            <div className="text-2xl font-bold text-blue-800">{status.publishedPages}</div>
            <div className="text-xs text-blue-600">Published Pages</div>
            <div className="text-xs text-gray-500">{status.pages} total</div>
          </div>
          
          <div className="text-center p-3 bg-purple-50 rounded-lg">
            <ExternalLink className="h-6 w-6 text-purple-600 mx-auto mb-2" />
            <div className="text-2xl font-bold text-purple-800">{status.activeLinks}</div>
            <div className="text-xs text-purple-600">Active Links</div>
            <div className="text-xs text-gray-500">{status.footerLinks} total</div>
          </div>
          
          <div className="text-center p-3 bg-orange-50 rounded-lg">
            <MapPin className="h-6 w-6 text-orange-600 mx-auto mb-2" />
            <div className="text-2xl font-bold text-orange-800">{status.locations}</div>
            <div className="text-xs text-orange-600">Locations</div>
            <div className="text-xs text-gray-500">Popular areas</div>
          </div>
          
          <div className="text-center p-3 bg-pink-50 rounded-lg">
            <Users className="h-6 w-6 text-pink-600 mx-auto mb-2" />
            <div className="text-2xl font-bold text-pink-800">{status.socialLinks}</div>
            <div className="text-xs text-pink-600">Social Links</div>
            <div className="text-xs text-gray-500">Connected</div>
          </div>
        </div>

        {/* Features List */}
        <div className="space-y-3">
          <h4 className="font-semibold text-gray-900">Active Features:</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
            <div className="flex items-center space-x-2">
              <Check className="h-4 w-4 text-green-500" />
              <span>Auto-update on page publish</span>
            </div>
            <div className="flex items-center space-x-2">
              <Check className="h-4 w-4 text-green-500" />
              <span>Real-time admin changes</span>
            </div>
            <div className="flex items-center space-x-2">
              <Check className="h-4 w-4 text-green-500" />
              <span>SEO-optimized pages</span>
            </div>
            <div className="flex items-center space-x-2">
              <Check className="h-4 w-4 text-green-500" />
              <span>View tracking enabled</span>
            </div>
            <div className="flex items-center space-x-2">
              <Check className="h-4 w-4 text-green-500" />
              <span>Mobile responsive</span>
            </div>
            <div className="flex items-center space-x-2">
              <Check className="h-4 w-4 text-green-500" />
              <span>Database-driven content</span>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="pt-4 border-t">
          <h4 className="font-semibold text-gray-900 mb-3">Quick Actions:</h4>
          <div className="flex flex-wrap gap-2">
            <Button 
              size="sm" 
              variant="outline"
              onClick={() => window.open('/page/about-us', '_blank')}
            >
              <Eye className="h-3 w-3 mr-1" />
              Preview Pages
            </Button>
            <Button 
              size="sm" 
              variant="outline"
              onClick={() => window.open('/', '_blank')}
            >
              <Globe className="h-3 w-3 mr-1" />
              View Footer
            </Button>
            <Button 
              size="sm" 
              variant="outline"
              onClick={triggerFooterRefresh}
            >
              <RefreshCw className="h-3 w-3 mr-1" />
              Force Update
            </Button>
          </div>
        </div>

        {/* Last Updated */}
        <div className="text-xs text-gray-500 pt-2 border-t">
          Last checked: {status.lastUpdated ? new Date(status.lastUpdated).toLocaleString() : 'Never'}
        </div>
      </CardContent>
    </Card>
  );
}
