import { Request, Response } from 'express';
import { AuthService } from '../services/auth.service';
import { catchAsync } from '../../../shared/utils/appError';

export class AuthController {
  /**
   * Controller to handle user registration requests.
   * Leverages catchAsync to automatically forward errors to the global error handler.
   */
  public static register = catchAsync(async (req: Request, res: Response): Promise<void> => {
    // Body payload is already cleaned and validated by validation middleware
    const result = await AuthService.register(req.body);

    res.status(201).json({
      success: true,
      data: result,
    });
  });

  /**
   * Controller to handle user login requests.
   * Leverages catchAsync to automatically forward errors to the global error handler.
   */
  public static login = catchAsync(async (req: Request, res: Response): Promise<void> => {
    // Body payload is already cleaned and validated by validation middleware
    const result = await AuthService.login(req.body);

    res.status(200).json({
      success: true,
      data: result,
    });
  });
}
