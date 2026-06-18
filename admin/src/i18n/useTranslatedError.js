import { useTranslation } from 'react-i18next';

const useTranslatedError = () => {
  const { t } = useTranslation(['errors']);

  return (error) => {
    const code = error?.response?.data?.code;
    
    if (code) {
      // Use the defaultValue capability of react-i18next for fallback
      // Since t() will just return the key if missing, we provide the DEFAULT translation as the default value.
      const translated = t(`errors:${code}`);
      if (translated !== `errors:${code}`) {
          return translated;
      }
      return t('errors:DEFAULT');
    }
    
    // Optional: if validation error or dynamic message, use it instead
    if (error?.response?.data?.message) {
      return error.response.data.message;
    }

    return t('errors:DEFAULT');
  };
};

export default useTranslatedError;
