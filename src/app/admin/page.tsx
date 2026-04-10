export default function AdminDashboardPage() {
  return (
    <div>
      <h1 className="text-3xl font-semibold mb-6 text-gray-800">Tổng quan hệ thống</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <p className="text-sm font-medium text-gray-500 mb-1">Chào mừng</p>
          <h2 className="text-xl font-bold text-gray-800">Thống soái 👋</h2>
          <p className="text-sm text-gray-600 mt-2">Truy cập khu vực Quản lý bài viết để thêm bài Blog mới cho Landing Page.</p>
        </div>
      </div>
    </div>
  );
}
