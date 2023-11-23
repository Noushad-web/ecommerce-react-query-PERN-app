import { Request, Response } from 'express';
import createHttpError from 'http-errors';
import { ValidatedRegisteredVendor } from './validations/vendorRegisterationDataValidationSchema';
import { pgquery } from '../../../db';
import { vendorServices } from './services';
import { Vendor } from '../../../types/vendor';

async function registerVendor(req: Request, res: Response) {
  const validatedRegisteredVendor = res.locals.validatedRegisteredVendor as
    | ValidatedRegisteredVendor
    | undefined;

  // ✅ checking validatedRegisteredVendor
  if (!validatedRegisteredVendor) {
    throw createHttpError(
      404,
      'validatedRegisteredVendor data not found for vendor registeration.'
    );
  }

  // ✅ inserting vendor
  const { vendor_slug, email, fullname, hash_password } = validatedRegisteredVendor;
  const getProductQueryResult = await pgquery({
    text: `INSERT INTO vendors (vendor_slug, email, fullname, hash_password)
    VALUES ($1, $2, $3, $4) RETURNING vendor_slug;`,
    values: [vendor_slug, email, fullname, hash_password],
  });
  const { rowCount, rows } = getProductQueryResult;
  if (!rowCount) {
    throw createHttpError(500, 'Error while inserting vendor.');
  }
  const insertedVendor = rows[0];

  res.json({
    success: !!rowCount,
    msg: 'Vendor registered',
    data: {
      vendorSlug: insertedVendor.vendor_slug,
    },
  });
}

async function getVendor(req: Request, res: Response) {
  const { vendor_id: vendorId } = res.locals.vendor as Vendor;
  const requestResponse = await vendorServices.getVendor('vendor_id', vendorId);
  const { rowCount, rows } = requestResponse;
  const vendor = rows[0] as Vendor;

  res.json({
    success: !!rowCount && !!rows.length,
    data: {
      email: vendor.email,
      fullname: vendor.fullname,
      isPremium: vendor.is_premium,
      vendorId: String(vendor.vendor_id),
      vendorSlug: vendor.vendor_slug,
    },
  });
}

export const vendorControllersV1 = {
  registerVendor,
  getVendor,
};
