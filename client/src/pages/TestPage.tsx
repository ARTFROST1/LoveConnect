import { useLocation } from 'wouter';
import { telegramService } from '@/lib/telegram';

export default function TestPage() {
  const [location] = useLocation();
  const user = telegramService.user;
  const startParam = telegramService.startParam;

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-md mx-auto space-y-4">
        <h1 className="text-2xl font-bold text-center">WebApp Test Page</h1>
        
        <div className="bg-card p-4 rounded-lg border">
          <h2 className="font-semibold mb-2">Current Route:</h2>
          <p className="text-sm font-mono bg-muted p-2 rounded">{location}</p>
        </div>

        <div className="bg-card p-4 rounded-lg border">
          <h2 className="font-semibold mb-2">Telegram User:</h2>
          {user ? (
            <div className="text-sm space-y-1">
              <p><strong>ID:</strong> {user.id}</p>
              <p><strong>Name:</strong> {user.first_name} {user.last_name || ''}</p>
              <p><strong>Username:</strong> {user.username || 'N/A'}</p>
            </div>
          ) : (
            <p className="text-red-500">No user data available</p>
          )}
        </div>

        <div className="bg-card p-4 rounded-lg border">
          <h2 className="font-semibold mb-2">Start Parameter:</h2>
          <p className="text-sm font-mono bg-muted p-2 rounded">
            {startParam || 'No start parameter'}
          </p>
        </div>

        <div className="bg-card p-4 rounded-lg border">
          <h2 className="font-semibold mb-2">URL Parameters:</h2>
          <div className="text-sm space-y-1">
            {Array.from(new URLSearchParams(window.location.search)).map(([key, value]) => (
              <p key={key}><strong>{key}:</strong> {value}</p>
            ))}
          </div>
        </div>

        <div className="bg-card p-4 rounded-lg border">
          <h2 className="font-semibold mb-2">Environment:</h2>
          <p className="text-sm">
            <strong>Development Mode:</strong> {telegramService.isDevelopment ? 'Yes' : 'No'}
          </p>
          <p className="text-sm">
            <strong>Telegram Available:</strong> {telegramService.isAvailable ? 'Yes' : 'No'}
          </p>
        </div>

        <div className="text-center text-sm text-muted-foreground">
          <p>This test page helps diagnose WebApp issues</p>
        </div>
      </div>
    </div>
  );
}