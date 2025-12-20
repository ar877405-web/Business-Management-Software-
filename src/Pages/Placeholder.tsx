import { LucideIcon } from 'lucide-react';

interface PlaceholderProps {
  icon: LucideIcon;
  title: string;
  description: string;
}

export default function Placeholder({ icon: Icon, title, description }: PlaceholderProps) {
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="text-center">
        <div className="bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
          <Icon className="w-8 h-8 text-blue-600" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">{title}</h1>
        <p className="text-gray-600 max-w-md">{description}</p>
      </div>
    </div>
  );
}
