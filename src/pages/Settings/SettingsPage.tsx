import { PageHeader } from '../../components/common/PageHeader'
import { useAuth } from '../../context/AuthContext'

export default function SettingsPage() {
  const { user } = useAuth()

  return (
    <div className="min-h-screen">
      <PageHeader title="Settings" description="Manage your organization and account." />

      <div className="px-6 pb-10 max-w-2xl space-y-6">

        <div className="card space-y-4">
          <h2 className="text-sm font-semibold text-gray-900">Account</h2>
          <div className="border-t border-gray-100" />
          <div className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm">
            <div>
              <p className="text-xs text-gray-400 mb-0.5">Email</p>
              <p className="font-mono text-gray-700">{user?.email ?? '—'}</p>
            </div>
            <div>
              <p className="text-xs text-gray-400 mb-0.5">User ID</p>
              <p className="font-mono text-xs text-gray-500 truncate">{user?.id ?? '—'}</p>
            </div>
          </div>
        </div>

        <div className="card space-y-4">
          <h2 className="text-sm font-semibold text-gray-900">Organization</h2>
          <div className="border-t border-gray-100" />
          <p className="text-sm text-gray-400">Org settings coming soon — seat management, billing, and API keys.</p>
        </div>

        <div className="card space-y-4">
          <h2 className="text-sm font-semibold text-gray-900">wrp.js pixel</h2>
          <div className="border-t border-gray-100" />
          <p className="text-xs text-gray-400 mb-2">Add this to your site to start tracking influencer clicks.</p>
          <pre className="text-[11px] font-mono bg-gray-900 text-green-300 rounded-lg p-3 overflow-x-auto">
{`<script>
  (function(w,r){
    w._wrp=w._wrp||[];
    var s=document.createElement('script');
    s.src='https://cdn.wrpper.com/wrp.js';
    s.async=true;
    document.head.appendChild(s);
  })(window,'wrpper');
</script>`}
          </pre>
        </div>

      </div>
    </div>
  )
}
