import { Cpu, MemoryStick, MonitorCog, Layers } from 'lucide-react'
import { Combobox } from '@/components/ui/combobox'
import { Select } from '@/components/ui/select'
import { useHardwareContext } from '../context/hardware-context'
import { SpecPill } from './spec-pill'
import { formatCores, formatRam, formatVram } from '../utils/format-hardware'
import { CPU_MODEL_OPTIONS } from '../utils/cpu-options'
import { RAM_GB_OPTIONS, toRamOption } from '../utils/ram-options'

export function HardwareScanPanel() {
  const { hardware, status, detectedRamGb, setCpuModel, setRamGb } = useHardwareContext()
  // Con valor vacío el select apunta a la fila «detectado»: así lo escaneado
  // sigue siendo una opción a la que volver después de haberlo cambiado.
  const isRamManual = hardware.ramConfidence === 'measured'
  const ramValue = isRamManual ? String(toRamOption(hardware.ramGb) ?? '') : ''
  // La fila de lo detectado se etiqueta como se leía antes la píldora —
  // «≥ 8 GB *»: el piso del navegador y su asterisco viajan dentro de la
  // opción, así que al elegir una capacidad concreta desaparecen solos.
  const detectedRamLabel =
    detectedRamGb !== null
      ? `${formatRam(toRamOption(detectedRamGb), 'estimated')} *`
      : 'Sin detectar'
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
          confidence={hardware.ramConfidence}
          control={
            <Select
              aria-label="RAM instalada"
              title="El navegador solo detecta un mínimo — ajústalo a tu RAM real."
              value={ramValue}
              onChange={(event) => setRamGb(event.target.value ? Number(event.target.value) : null)}
              containerClassName="w-auto min-w-0 max-w-full"
              // Fondo explícito: el desplegable nativo hereda el del campo, y
              // en transparente el navegador lo pinta en blanco.
              className="h-6 w-auto max-w-full cursor-pointer rounded-sm border-none bg-bg-elevated pl-0 pr-6 font-mono text-sm text-text"
            >
              <option value="">{detectedRamLabel}</option>
              <option disabled>──────────</option>
              {RAM_GB_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {option} GB
                </option>
              ))}
            </Select>
          }
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
