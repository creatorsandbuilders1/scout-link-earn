import { Link } from 'react-router-dom';
import { 
  MessageSquare, 
  FileText, 
  CheckCircle, 
  XCircle, 
  DollarSign, 
  Target,
  Megaphone,
  FileCheck
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { useNotifications, type Notification } from '@/hooks/useNotifications';
import { toast } from 'sonner';

interface NotificationItemProps {
  notification: Notification;
  onClose?: () => void;
}

const notificationIcons = {
  new_message: MessageSquare,
  proposal_received: FileText,
  proposal_accepted: CheckCircle,
  proposal_declined: XCircle,
  work_submitted: FileCheck,
  payment_received: DollarSign,
  payment_sent: DollarSign,
  scout_earning: Target,
  announcement: Megaphone,
};

const notificationColors = {
  new_message: 'text-blue-500',
  proposal_received: 'text-purple-500',
  proposal_accepted: 'text-green-500',
  proposal_declined: 'text-red-500',
  work_submitted: 'text-orange-500',
  payment_received: 'text-green-500',
  payment_sent: 'text-blue-500',
  scout_earning: 'text-orange-500',
  announcement: 'text-primary',
};

export function NotificationItem({ notification, onClose }: NotificationItemProps) {
  const { markAsRead } = useNotifications();
  const Icon = notificationIcons[notification.type as keyof typeof notificationIcons] || FileText;
  const iconColor = notificationColors[notification.type as keyof typeof notificationColors] || 'text-muted-foreground';

  const handleClick = async () => {
    try {
      if (!notification.read) {
        await markAsRead(notification.id);
      }
      if (onClose) {
        onClose();
      }
    } catch (error) {
      console.error('[NotificationItem] Error marking as read:', error);
      toast.error('Failed to mark notification as read');
    }
  };

  const content = (
    <div 
      className={`p-4 hover:bg-muted/50 transition-colors cursor-pointer ${
        !notification.read ? 'bg-primary/5' : ''
      }`}
      onClick={handleClick}
    >
      <div className="flex gap-3">
        <div className={`flex-shrink-0 ${iconColor}`}>
          <Icon className="h-5 w-5" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 mb-1">
            <h4 className="font-semibold text-sm">{notification.title}</h4>
            {!notification.read && (
              <div className="h-2 w-2 bg-primary rounded-full flex-shrink-0 mt-1" />
            )}
          </div>
          <p className="text-sm text-muted-foreground line-clamp-2">
            {notification.message}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
          </p>
        </div>
      </div>
    </div>
  );

  if (notification.link) {
    return (
      <Link to={notification.link}>
        {content}
      </Link>
    );
  }

  return content;
}
