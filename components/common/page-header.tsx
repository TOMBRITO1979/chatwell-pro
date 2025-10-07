import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { LucideIcon } from 'lucide-react';

interface PageHeaderProps {
  title: string;
  description: string;
  icon: LucideIcon;
  color?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export function PageHeader({ title, description, icon: Icon, color = 'text-chatwell-blue', action }: PageHeaderProps) {
  return (
    <Card className="rounded-2xl border-t-4 border-chatwell-blue shadow-sm mb-6">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 chatwell-gradient rounded-xl flex items-center justify-center">
              <Icon className="w-6 h-6 text-white" />
            </div>
            <div>
              <CardTitle className={`text-2xl font-bold ${color}`}>
                {title}
              </CardTitle>
              <p className="text-muted-foreground mt-1">
                {description}
              </p>
            </div>
          </div>
          {action && (
            <Button
              onClick={action.onClick}
              className="chatwell-gradient text-white hover:opacity-90"
            >
              {action.label}
            </Button>
          )}
        </div>
      </CardHeader>
    </Card>
  );
}