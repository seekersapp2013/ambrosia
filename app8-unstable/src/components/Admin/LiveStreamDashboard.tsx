import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";

export function LiveStreamDashboard() {
  const allLiveStreams = useQuery(api.liveStreams.getAllLiveStreams, { limit: 100 });
  const streamMetrics = useQuery(api.liveStreams.getStreamPerformanceMetrics);
  const endStream = useMutation(api.liveStreams.endLiveStream);

  const handleEndStream = async (streamId: string) => {
    const confirmEnd = window.confirm("Are you sure you want to end this live stream?");
    if (!confirmEnd) return;

    try {
      await endStream({
        streamId,
        livekitHost: process.env.LIVEKIT_URL!,
        livekitApiKey: process.env.LIVEKIT_API_KEY!,
        livekitApiSecret: process.env.LIVEKIT_API_SECRET!,
      });
    } catch (error) {
      console.error("Failed to end stream:", error);
      alert("Failed to end stream. Please try again.");
    }
  };

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Live Streams Dashboard</h1>

      {streamMetrics && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
          <div className="bg-blue-100 p-4 rounded-lg shadow">
            <h2 className="text-lg font-semibold text-blue-800">Total Streams</h2>
            <p className="text-3xl font-bold text-blue-900">{streamMetrics.totalStreams}</p>
          </div>
          <div className="bg-green-100 p-4 rounded-lg shadow">
            <h2 className="text-lg font-semibold text-green-800">Live Streams</h2>
            <p className="text-3xl font-bold text-green-900">{streamMetrics.liveStreams}</p>
          </div>
          <div className="bg-yellow-100 p-4 rounded-lg shadow">
            <h2 className="text-lg font-semibold text-yellow-800">Ended Streams</h2>
            <p className="text-3xl font-bold text-yellow-900">{streamMetrics.endedStreams}</p>
          </div>
          <div className="bg-purple-100 p-4 rounded-lg shadow">
            <h2 className="text-lg font-semibold text-purple-800">Avg. Duration</h2>
            <p className="text-3xl font-bold text-purple-900">{streamMetrics.averageStreamDuration.toFixed(2)} min</p>
          </div>
          <div className="bg-pink-100 p-4 rounded-lg shadow">
            <h2 className="text-lg font-semibold text-pink-800">Peak Viewers</h2>
            <p className="text-3xl font-bold text-pink-900">{streamMetrics.peakConcurrentViewers}</p>
          </div>
          <div className="bg-indigo-100 p-4 rounded-lg shadow">
            <h2 className="text-lg font-semibold text-indigo-800">Unique Broadcasters</h2>
            <p className="text-3xl font-bold text-indigo-900">{streamMetrics.uniqueBroadcasters}</p>
          </div>
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="min-w-full bg-white">
          <thead>
            <tr>
              <th className="py-2 px-4 border-b">Stream ID</th>
              <th className="py-2 px-4 border-b">Title</th>
              <th className="py-2 px-4 border-b">Author</th>
              <th className="py-2 px-4 border-b">Status</th>
              <th className="py-2 px-4 border-b">Viewers</th>
              <th className="py-2 px-4 border-b">Created At</th>
              <th className="py-2 px-4 border-b">Actions</th>
            </tr>
          </thead>
          <tbody>
            {allLiveStreams?.map((stream) => (
              <tr key={stream._id}>
                <td className="py-2 px-4 border-b">{stream._id}</td>
                <td className="py-2 px-4 border-b">{stream.title}</td>
                <td className="py-2 px-4 border-b">{stream.author.username}</td>
                <td className="py-2 px-4 border-b">{stream.status}</td>
                <td className="py-2 px-4 border-b">{stream.viewerCount}</td>
                <td className="py-2 px-4 border-b">{new Date(stream.createdAt).toLocaleString()}</td>
                <td className="py-2 px-4 border-b">
                  {stream.status === "live" && (
                    <button
                      onClick={() => handleEndStream(stream._id)}
                      className="bg-red-500 text-white px-4 py-2 rounded-lg font-medium"
                    >
                      End Stream
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}