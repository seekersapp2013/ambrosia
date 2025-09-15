import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useState } from "react";

interface NotificationsScreenProps {
  onBack: () => void;
}

export function NotificationsScreen({ onBack: _onBack }: NotificationsScreenProps) {
  const notifications = useQuery(api.notifications.getMyNotifications);
  const markAsRead = useMutation(api.notifications.markAsRead);
  const markAllAsRead = useMutation(api.notifications.markAllAsRead);
  const [filter, setFilter] = useState<"all" | "unread">("all");

  const filteredNotifications = notifications?.filter(notification => 
    filter === "all" || !notification.isRead
  ) || [];

  const handleMarkAsRead = async (notificationId: string) => {
    try {
      await markAsRead({ notificationId: notificationId as any });
    } catch (error) {
      console.error("Failed to mark notification as read:", error);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await markAllAsRead({});
    } catch (error) {
      console.error("Failed to mark all notifications as read:", error);
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'email_sent':
        return 'fas fa-envelope';
      case 'wallet_created':
        return 'fas fa-wallet';
      case 'payment_received':
        return 'fas fa-money-bill';
      case 'follow':
        return 'fas fa-user-plus';
      case 'like':
        return 'fas fa-heart';
      case 'comment':
        return 'fas fa-comment';
      default:
        return 'fas fa-bell';
    }
  };

  return (
    <div className="p-4 space-y-4">
      {/* Header with filters */}
      <div className="flex items-center justify-between">
        <div className="flex space-x-4">
          <button
            onClick={() => setFilter("all")}
            className={`px-3 py-1 rounded-full text-sm font-medium ${
              filter === "all" 
                ? "bg-accent text-white" 
                : "bg-gray-200 text-gray-700"
            }`}
          >
            All
          </button>
          <button
            onClick={() => setFilter("unread")}
            className={`px-3 py-1 rounded-full text-sm font-medium ${
              filter === "unread" 
                ? "bg-accent text-white" 
                : "bg-gray-200 text-gray-700"
            }`}
          >
            Unread
          </button>
        </div>
        
        {notifications && notifications.some(n => !n.isRead) && (
          <button
            onClick={handleMarkAllAsRead}
            className="text-accent text-sm font-medium"
          >
            Mark all read
          </button>
        )}
      </div>

      {/* Notifications list */}
      {notifications === undefined ? (
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin w-6 h-6 border-2 border-accent border-t-transparent rounded-full mr-3"></div>
          <p className="text-gray-500">Loading notifications...</p>
        </div>
      ) : filteredNotifications.length === 0 ? (
        <div className="text-center py-8">
          <i className="fas fa-bell-slash text-4xl text-gray-300 mb-4"></i>
          <p className="text-gray-500">
            {filter === "unread" ? "No unread notifications" : "No notifications yet"}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredNotifications.map((notification) => (
            <div
              key={notification._id}
              className={`p-4 rounded-lg border ${
                notification.isRead 
                  ? "bg-white border-gray-200" 
                  : "bg-ambrosia-50 border-accent"
              }`}
              onClick={() => !notification.isRead && handleMarkAsRead(notification._id)}
            >
              <div className="flex items-start space-x-3">
                <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                  notification.isRead ? "bg-gray-200" : "bg-accent"
                }`}>
                  <i className={`${getNotificationIcon(notification.type)} text-sm ${
                    notification.isRead ? "text-gray-600" : "text-white"
                  }`}></i>
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <h3 className={`text-sm font-medium ${
                      notification.isRead ? "text-gray-900" : "text-accent"
                    }`}>
                      {notification.title}
                    </h3>
                    {!notification.isRead && (
                      <div className="w-2 h-2 bg-accent rounded-full"></div>
                    )}
                  </div>
                  <p className="text-sm text-gray-600 mt-1">
                    {notification.message}
                  </p>
                  <p className="text-xs text-gray-400 mt-2">
                    {new Date(notification.createdAt).toLocaleString()}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}