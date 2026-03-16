// Hook to check if COD is available for a product
export const useCodAvailability = () => {
  const checkCodAvailable = async (productCodAvailable) => {
    try {
      const response = await fetch('/api/settings/cod');
      const data = await response.json();
      // COD is available only if BOTH global AND product settings are true
      return data.globalCodEnabled && productCodAvailable;
    } catch (error) {
      console.error('Error checking COD availability:', error);
      return productCodAvailable; // fallback to product setting
    }
  };

  return { checkCodAvailable };
};
