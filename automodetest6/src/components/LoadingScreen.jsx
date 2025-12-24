import { Loader2 } from 'lucide-react';

function LoadingScreen({ message = 'Loading...' }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center">
        <Loader2 className="w-12 h-12 text-primary mx-auto mb-4 spinner" />
        <h2 className="text-xl font-semibold text-foreground mb-2">Automatic Mode Detection</h2>
        <p className="text-muted-foreground loading-pulse">{message}</p>
      </div>
    </div>
  );
}

export default LoadingScreen;
