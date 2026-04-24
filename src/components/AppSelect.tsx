import Select, { type StylesConfig } from 'react-select'

export type AppSelectOption = {
  value: string
  label: string
}

type AppSelectProps = {
  inputId?: string
  value: string
  options: AppSelectOption[]
  onChange: (value: string) => void
  placeholder?: string
  isDisabled?: boolean
  isClearable?: boolean
  isLoading?: boolean
  noOptionsMessage?: string
  size?: 'sm' | 'md'
}

const buildStyles = (size: 'sm' | 'md'): StylesConfig<AppSelectOption, false> => {
  const isSmall = size === 'sm'
  const minHeight = isSmall ? 31 : 38
  const fontSize = isSmall ? '0.875rem' : '1rem'

  return {
    control: (base, state) => ({
      ...base,
      minHeight,
      fontSize,
      borderColor: state.isFocused ? '#86b7fe' : '#dee2e6',
      boxShadow: state.isFocused ? '0 0 0 0.25rem rgba(13, 110, 253, 0.25)' : 'none',
      '&:hover': {
        borderColor: state.isFocused ? '#86b7fe' : '#ced4da',
      },
    }),
    valueContainer: (base) => ({
      ...base,
      padding: isSmall ? '0 6px' : '1px 8px',
    }),
    input: (base) => ({
      ...base,
      margin: 0,
      padding: 0,
    }),
    placeholder: (base) => ({
      ...base,
      color: '#6c757d',
    }),
    menu: (base) => ({
      ...base,
      zIndex: 20,
      fontSize,
    }),
    menuPortal: (base) => ({
      ...base,
      zIndex: 2000,
    }),
  }
}

function AppSelect({
  inputId,
  value,
  options,
  onChange,
  placeholder = 'Choose...',
  isDisabled = false,
  isClearable = false,
  isLoading = false,
  noOptionsMessage = 'No options',
  size = 'md',
}: AppSelectProps) {
  return (
    <Select<AppSelectOption, false>
      inputId={inputId}
      classNamePrefix='react-select'
      options={options}
      value={options.find((option) => option.value === value) ?? null}
      onChange={(option) => onChange(option?.value ?? '')}
      isDisabled={isDisabled}
      isClearable={isClearable}
      isLoading={isLoading}
      placeholder={placeholder}
      noOptionsMessage={() => noOptionsMessage}
      styles={buildStyles(size)}
      menuPortalTarget={typeof document !== 'undefined' ? document.body : undefined}
      menuPosition='fixed'
    />
  )
}

export default AppSelect
