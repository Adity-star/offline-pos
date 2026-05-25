'use client'

import { useState, useEffect } from 'react'
import { DatabaseBackup, UploadCloud, Download, RotateCcw, ShieldAlert, CheckCircle2 } from 'lucide-react'
import { toast } from 'sonner'
import { format } from 'date-fns'

import { PageHeader } from '@/components/shared/page-header'
import { PageLoading } from '@/components/shared/loading'
import { ConfirmDialog } from '@/components/shared/confirm-dialog'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

export default function BackupPage() {
   const [backups, setBackups] = useState<any[]>([])
   const [loading, setLoading] = useState(true)
   const [isProcessing, setIsProcessing] = useState(false)
   const [restoreConfirmOpen, setRestoreConfirmOpen] = useState(false)
   const [selectedBackupToRestore, setSelectedBackupToRestore] = useState<string | null>(null)
   const [isElectron, setIsElectron] = useState(false)
   const [mounted, setMounted] = useState(false)

   const fetchBackups = async () => {
     try {
       if (isElectron) {
         const list = await window.electron.listBackups()
         setBackups(list || [])
       }
     } catch (error) {
       console.error('Failed to load backups')
     } finally {
       setLoading(false)
     }
   }

  useEffect(() => {
  setMounted(true)

  const electronAvailable =
    typeof window !== 'undefined' &&
    !!window.electron

  setIsElectron(
    electronAvailable
  )

  if (electronAvailable) {
    fetchBackups()
  } else {
    setLoading(false)
  }
}, [])

  const handleCreateBackup = async () => {
    if (!isElectron) {
      toast.error('This feature is only available in the desktop app')
      return
    }
    setIsProcessing(true)
    try {
      const result = await window.electron.createBackup()
      if (result?.success) {
        toast.success(`Backup created successfully at ${result.filePath}`)
        fetchBackups()
      } else {
        throw new Error(result?.error)
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to create backup')
    } finally {
      setIsProcessing(false)
    }
  }

  const triggerRestore = (path?: string) => {
    setSelectedBackupToRestore(path || null)
    setRestoreConfirmOpen(true)
  }

  const handleRestore = async () => {
    if (!isElectron) {
      toast.error('This feature is only available in the desktop app')
      return
    }
    setIsProcessing(true)
    try {
      const result = await window.electron.restoreBackup(selectedBackupToRestore || undefined)
      if (result?.success) {
        toast.success('Database restored successfully! The application will now reload.')
        setTimeout(() => window.location.reload(), 2000)
      } else {
        if (result?.error !== 'Cancelled') {
           throw new Error(result?.error)
        }
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to restore backup')
    } finally {
      setIsProcessing(false)
      setRestoreConfirmOpen(false)
      setSelectedBackupToRestore(null)
    }
  }

  if (!mounted) {
    return <PageLoading/>
  }

  return (
    <div className="flex h-full flex-col space-y-6 p-6 overflow-auto">
      <PageHeader 
        title="Backup & Restore" 
        description="Secure your business data and restore it if you move to a new computer." 
      />

      {!isElectron && (
        <div className="bg-amber-50 border border-amber-200 text-amber-800 p-4 rounded-md">
          <p className="font-medium">Desktop App Required</p>
          <p className="text-sm mt-1">Backup and restore features are only available when running the desktop application.</p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
        <Card className="border-emerald-500/20 shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center text-emerald-700">
              <DatabaseBackup className="w-5 h-5 mr-2" />
              Create Backup
            </CardTitle>
            <CardDescription>Instantly save a copy of all current sales, customers, and inventory data.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-emerald-50 text-emerald-800 p-4 rounded-md text-sm flex gap-3">
              <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5" />
              <p>Creates a highly compressed ZIP file of your SQLite Database. It is stored securely in your Desktop in "OfflinePOS_Backups".</p>
            </div>
            <Button 
              className="w-full bg-emerald-600 hover:bg-emerald-700 h-12 text-md" 
              onClick={handleCreateBackup}
              disabled={isProcessing || !isElectron}
            >
              <UploadCloud className="w-5 h-5 mr-2" />
              Create Full Backup Now
            </Button>
          </CardContent>
        </Card>

        <Card className="border-amber-500/20 shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center text-amber-700">
              <RotateCcw className="w-5 h-5 mr-2" />
              Restore Database
            </CardTitle>
            <CardDescription>Overwrites the current database entirely with a previous backup file.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-amber-50 text-amber-800 p-4 rounded-md text-sm flex gap-3">
               <ShieldAlert className="w-5 h-5 shrink-0 mt-0.5" />
               <p>Warning: Restoring a backup will instantly erase all data created since the backup date. This cannot be undone.</p>
            </div>
            <Button 
              variant="outline"
              className="w-full h-12 text-md border-amber-500 text-amber-700 hover:bg-amber-50" 
              onClick={() => triggerRestore()}
              disabled={isProcessing || !isElectron}
            >
              <Download className="w-5 h-5 mr-2" />
              Select ZIP & Restore
            </Button>
          </CardContent>
        </Card>

        <Card className="md:col-span-2 mt-4">
           <CardHeader>
             <CardTitle>Recent Local Backups</CardTitle>
             <CardDescription>Backups automatically found in your Desktop/OfflinePOS_Backups folder</CardDescription>
           </CardHeader>
           <CardContent>
             {loading ? <PageLoading /> : backups.length === 0 ? (
               <div className="text-center p-8 text-muted-foreground border-2 border-dashed rounded-lg bg-muted/20">
                 No automated or manual backups found in the local folder.
               </div>
             ) : (
               <div className="rounded-md border divide-y overflow-hidden">
                 {backups.map((b) => (
                   <div key={b.name} className="flex items-center justify-between p-4 bg-card hover:bg-muted/50 transition-colors">
                     <div>
                       <div className="font-semibold text-primary">{b.name}</div>
                       <div className="text-xs text-muted-foreground flex gap-3 mt-1">
                          <span>{format(new Date(b.createdAt), 'dd MMMM yyyy, hh:mm a')}</span>
                          <span>•</span>
                          <span>{(b.size / 1024 / 1024).toFixed(2)} MB</span>
                       </div>
                     </div>
<Button 
                         variant="ghost" 
                         size="sm" 
                         className="text-amber-600 hover:text-amber-700 hover:bg-amber-100"
                         onClick={() => triggerRestore(b.path)}
                         disabled={!isElectron}
                       >
                        <RotateCcw className="w-4 h-4 mr-2" />
                        Restore
                      </Button>
                   </div>
                 ))}
               </div>
             )}
           </CardContent>
        </Card>
      </div>

<ConfirmDialog
         open={restoreConfirmOpen}
         onOpenChange={setRestoreConfirmOpen}
         title="DANGER: Restoring Database"
         description="Are you absolutely sure you want to restore the database? All data and sales entered AFTER the backup date will be permanently deleted and replaced by the backup. The application will reboot."
         confirmLabel="Yes, Rewrite Database"
         variant="destructive"
         onConfirm={handleRestore}
       />
    </div>
  )
}
