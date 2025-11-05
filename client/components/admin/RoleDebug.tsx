import { useAuth } from "../../hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Badge } from "../ui/badge";
import { getRolePermissions, getRoleDisplayName, canAccessSection } from "../../utils/permissions";

export default function RoleDebug() {
  const { user } = useAuth();
  
  if (!user) {
    return <div>No user logged in</div>;
  }

  const userRole = user.role || "admin";
  const permissions = getRolePermissions(userRole);
  const displayName = getRoleDisplayName(userRole);

  const testSections = [
    "dashboard", "content-management", "ads-listing", "staff-management", 
    "system-status", "user-analytics", "categories", "packages"
  ];

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Current User Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-500">Name</label>
              <p className="text-lg">{user.name}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">Email</label>
              <p className="text-lg">{user.email}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">User Type</label>
              <p className="text-lg">{user.userType}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">Role</label>
              <p className="text-lg">
                <Badge className="bg-blue-100 text-blue-800">{displayName}</Badge>
              </p>
            </div>
          </div>
          
          {user.username && (
            <div>
              <label className="text-sm font-medium text-gray-500">Username</label>
              <p className="text-lg">@{user.username}</p>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Role Permissions ({permissions.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {permissions.map((permission) => (
              <Badge key={permission} variant="outline" className="text-xs">
                {permission}
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Section Access Test</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            {testSections.map((section) => {
              const hasAccess = canAccessSection(userRole, section);
              return (
                <div key={section} className="flex items-center justify-between p-3 border rounded">
                  <span className="font-medium">{section.replace("-", " ")}</span>
                  <Badge 
                    variant={hasAccess ? "default" : "destructive"}
                    className={hasAccess ? "bg-green-100 text-green-800" : ""}
                  >
                    {hasAccess ? "✅ Allowed" : "❌ Denied"}
                  </Badge>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Raw User Object</CardTitle>
        </CardHeader>
        <CardContent>
          <pre className="bg-gray-100 p-4 rounded text-sm overflow-auto">
            {JSON.stringify(user, null, 2)}
          </pre>
        </CardContent>
      </Card>
    </div>
  );
}
