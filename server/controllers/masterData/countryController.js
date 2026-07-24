const CountryModel = require('../../models/masterData/countryModel');

exports.getAllCountries = async (req, res, next) => {
  try {
    const { search, status } = req.query;
    const countries = await CountryModel.findAll({ search, status });
    res.json(countries);
  } catch (error) {
    next(error);
  }
};

exports.getCountryById = async (req, res, next) => {
  try {
    const country = await CountryModel.findById(req.params.id);
    if (!country) return res.status(404).json({ message: 'Country not found' });
    res.json(country);
  } catch (error) {
    next(error);
  }
};

exports.createCountry = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { country_code, country_name } = req.body;
    
    if (!country_code || !country_name) {
      return res.status(400).json({ message: 'Country Code and Name are required' });
    }

    const insertId = await CountryModel.create(req.body, userId);
    res.status(201).json({ message: 'Country created successfully', id: insertId });
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ message: 'Country Code already exists' });
    }
    next(error);
  }
};

exports.updateCountry = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const country = await CountryModel.findById(req.params.id);
    if (!country) return res.status(404).json({ message: 'Country not found' });

    const { country_code, country_name } = req.body;
    if (!country_code || !country_name) {
      return res.status(400).json({ message: 'Country Code and Name are required' });
    }

    await CountryModel.update(req.params.id, req.body, userId);
    res.json({ message: 'Country updated successfully' });
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ message: 'Country Code already exists' });
    }
    next(error);
  }
};
