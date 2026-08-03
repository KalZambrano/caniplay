import { Cpu, MemoryStick, MonitorCog, Layers } from 'lucide-react'
import { Combobox } from '@/components/ui/combobox'
import { useHardwareContext } from '../context/hardware-context'
import { SpecPill } from './spec-pill'
import { formatCores, formatRam, formatVram } from '../utils/format-hardware'
import { CPU_MODEL_OPTIONS } from '../utils/cpu-options'

export function HardwareScanPanel() {
  const { hardware, status, setCpuModel } = useHardwareContext()
  const isScanning = status === 'scanning'

  return (
    <div className="relative overflow-hidden rounded-lg border border-border bg-bg-elevated bg-scanlines">
      {isScanning && (
        <div
          aria-hidden
          className="animate-scan-sweep pointer-events-none absolute inset-x-0 h-24 bg-linear-to-b from-transparent via-brand/10 to-transparent"
        />
      )}

      <div className="flex items-center gap-2 border-b border-border px-4 py-3">
        <span
          className={
            isScanning ? 'size-2 animate-blink rounded-full bg-warn' : 'size-2 rounded-full bg-good'
          }
        />
        <span className="font-mono text-xs uppercase tracking-widest text-text-muted">
          {isScanning ? 'Escaneando tu equipo…' : 'Escaneo completo'}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-px bg-border sm:grid-cols-4">
        <SpecPill
          icon={<MonitorCog className="size-4" />}
          label="GPU"
          value={hardware.gpu.name ?? '—'}
          confidence={hardware.gpu.name ? 'measured' : 'unknown'}
        />
        <SpecPill
          icon={<Layers className="size-4" />}
          label="VRAM"
          value={formatVram(hardware.gpu.vramGb)}
          confidence={hardware.gpu.confidence}
        />
        <SpecPill
          icon={<MemoryStick className="size-4" />}
          label="RAM"
          value={formatRam(hardware.ramGb)}
          confidence={hardware.ramConfidence}
        />
        <SpecPill
          icon={<Cpu className="size-4" />}
          label="Núcleos"
          value={formatCores(hardware.cpuCores)}
          confidence={hardware.cpuCores !== null ? 'measured' : 'unknown'}
        />
      </div>

      <div className="border-t border-border px-4 py-3">
        <label
          htmlFor="cpu-model"
          className="mb-1.5 block font-mono text-[0.65rem] uppercase tracking-widest text-text-faint"
        >
          Modelo de CPU (no se puede detectar automáticamente)
        </label>
        <Combobox
          id="cpu-model"
          options={CPU_MODEL_OPTIONS}
          value={hardware.cpuModel}
          onChange={setCpuModel}
          placeholder="Busca tu CPU… ej. Ryzen 5 3600"
          emptyMessage="No encontramos ese modelo en nuestra base de datos."
        />
      </div>

      <p className="border-t border-border px-4 py-2 text-xs text-text-faint">
        * Estimaciones basadas en APIs del navegador. Las specs reales pueden variar.
      </p>
    </div>
  )
}
