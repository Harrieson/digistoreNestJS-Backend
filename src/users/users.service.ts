import { Inject, Injectable } from '@nestjs/common';
import config from 'config';
import { UserRepository } from 'src/shared/repositories/user.repository';
import { userTypes } from 'src/shared/schema/users';
import { sendEmail } from 'src/shared/utllity/mail-handler';
import {
  comparePassword,
  generateHashedPassword,
} from 'src/shared/utllity/password-manager';
import { generateToken } from 'src/shared/utllity/tokenGenerator';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

@Injectable()
export class UsersService {
  constructor(
    @Inject(UserRepository) private readonly userDB: UserRepository,
  ) {}

  // async create(createUserDto: CreateUserDto) {
  //   try {
  //     // generate the hash password
  //     createUserDto.password = await generateHashedPassword(
  //       createUserDto.password,
  //     );

  //     // Check if it's ADMIN
  //     if (
  //       createUserDto.type === userTypes.ADMIN &&
  //       createUserDto.secretToken !== config.get('adminSecretToken')
  //     ) {
  //       throw new Error('You do not have permisions to perform these actions');
  //     } else if (createUserDto.type !== userTypes.CUSTOMER) {
  //       createUserDto.isVerified = true;
  //     }

  //     //If user exists//
  //     const user = await this.userDB.findOne({
  //       email: createUserDto.email,
  //     });
  //     if (user) {
  //       throw new Error('A user with this ID already exists');
  //     }
  //     //No user found, generate OTP
  //     const otp = Math.floor(Math.random() * 9000000) + 100000;
  //     const otpExpiryTime = new Date();
  //     otpExpiryTime.setMinutes(otpExpiryTime.getMinutes() + 20);

  //     const newUser = await this.userDB.create({
  //       ...CreateUserDto,
  //       otp,
  //       otpExpiryTime,
  //     });
  //     if (newUser.type !== userTypes.ADMIN) {
  //       sendEmail(
  //         newUser.email,
  //         config.get('emailService.emailTemplates.verifyEmail'),
  //         'Email verification Digistore',
  //         {
  //           customerName: newUser.name,
  //           customerEmail: newUser.email,
  //           otp,
  //         },
  //       );
  //     }

  //     return {
  //       success: true,
  //       message:
  //         newUser.type === userTypes.ADMIN
  //           ? `Admin Account created for user ${newUser.name}`
  //           : `Please Activate your account. We've sent an email to ${newUser.email} for activation`,
  //       result: { email: newUser.email },
  //     };
  //   } catch (error) {
  //     throw error;
  //   }
  // }
  async create(createUserDto: CreateUserDto) {
    try {
      // generate the hash password
      createUserDto.password = await generateHashedPassword(
        createUserDto.password,
      );

      /// check is it for admin
      if (
        createUserDto.type === userTypes.ADMIN &&
        createUserDto.secretToken !== config.get('adminSecretToken')
      ) {
        throw new Error('You do not have permissions to perform these actions');
      } else if (createUserDto.type !== userTypes.CUSTOMER) {
        createUserDto.isVerified = true;
      }

      // user is already exist
      const user = await this.userDB.findOne({
        email: createUserDto.email,
      });
      if (user) {
        throw new Error(`A User With This ID ${user.name} already exists`);
      }

      // generate the otp
      const otp = Math.floor(Math.random() * 900000) + 100000;

      const otpExpiryTime = new Date();
      otpExpiryTime.setMinutes(otpExpiryTime.getMinutes() + 10);

      const newUser = await this.userDB.create({
        ...createUserDto,
        otp,
        otpExpiryTime,
      });
      if (newUser.type !== userTypes.ADMIN) {
        sendEmail(
          newUser.email,
          config.get('emailService.emailTemplates.verifyEmail'),
          'Email verification - DigiStore',
          {
            customerName: newUser.name,
            customerEmail: newUser.email,
            otp,
          },
        );
      }
      return {
        success: true,
        message:
          newUser.type === userTypes.ADMIN
            ? `Admin Account created for user ${newUser.name}`
            : 'Please activate your account by verifying your email. We have sent you a wmail with the otp',
        result: { email: newUser.email },
      };
    } catch (error) {
      throw error;
    }
  }

  //Login Logic for a registered User.
  async login(email: string, password: string) {
    try {
      const userExists = await this.userDB.findOne({
        email,
      });
      if (!userExists) {
        throw new Error(
          `Credentials ${userExists.email} are not registred with us`,
        );
      }
      if (!userExists.isVerified) {
        throw new Error('Please verify your account');
      }

      const isPasswordMatch = await comparePassword(
        password,
        userExists.password,
      );

      if (!isPasswordMatch) {
        throw new Error('Invalid Credentials');
      }

      const token = await generateToken(userExists._id);
      return {
        success: true,
        message: 'Login Successful',
        result: {
          user: {
            name: userExists.name,
            email: userExists.email,
            type: userExists.type,
            id: userExists._id.toString(),
          },
          token,
        },
      };
    } catch (error) {
      throw error;
    }
  }

  async verifyEmail(otp: string, email: string) {
    try {
      const user = await this.userDB.findOne({
        email,
      });
      if (!user) {
        throw new Error('User Email Not Registered');
      }
      if (user.otp !== otp) {
        throw new Error('Invalid or Expired OTP');
      }

      if (user.otpExpiryTime < new Date()) {
        throw new Error('Expired OTP');
      }
      await this.userDB.updateOne(
        {
          email,
        },
        {
          isVerified: true,
        },
      );

      return {
        success: true,
        message: 'Email verified successfully. You can proceed to login',
      };
    } catch (error) {
      throw error;
    }
  }

  async sendOtpEmail(email: string) {
    try {
      const user = await this.userDB.findOne({
        email,
      });
      if (!user) {
        throw new Error('User not found');
      }
      if (user.isVerified) {
        throw new Error('Email already verified');
      }
      const otp = Math.floor(Math.random() * 900000) + 100000;
      const otpExpiryTime = new Date();
      otpExpiryTime.setMinutes(otpExpiryTime.getMinutes() + 10);

      await this.userDB.updateOne(
        {
          email,
        },
        {
          otp,
          otpExpiryTime,
        },
      );

      sendEmail(
        user.email,
        config.get('emailService.emailTemplates.verifyEmail'),
        'Email Verification - Digistore',
        {
          customerName: user.name,
          customerEmail: user.email,
          otp,
        },
      );

      return {
        success: true,
        message: 'Otp sent Successfully',
        result: { email: user.email },
      };
    } catch (error) {
      throw error;
    }
  }

  async forgotPassword(email: string) {
    try {
      const user = await this.userDB.findOne({
        email,
      });
      if (!user) {
        throw new Error('User not found');
      }
      let password = Math.random().toString(36).substring(2, 12);
      password = await generateHashedPassword(password);
      await this.userDB.updateOne(
        {
          email,
        },
        {
          password,
        },
      );
      sendEmail(
        user.email,
        config.get('emailService.emailTemplate.forgotPassword'),
        'Forgot Password - Digistore',
        {
          customerName: user.name,
          customerEmail: user.email,
          newPassword: password,
          loginLink: config.get('login Link'),
        },
      );
    } catch (error) {
      throw error;
    }
  }

  async updatePasswordOrName(
    id: string,
    updatePasswordOrNameDto: UpdateUserDto,
  ) {
    try {
      const { oldPassword, newPassword, name } = updatePasswordOrNameDto;
      const user = await this.userDB.findOne({
        _id: id,
      });
      if (!user) {
        throw new Error('User not found');
      }
      if (newPassword) {
        const isPasswordMatch = await comparePassword(
          user.password,
          oldPassword,
        );
        if (!isPasswordMatch) {
          throw new Error('Invalid old password');
        }
        const password = await generateHashedPassword(newPassword);
        await this.userDB.updateOne(
          {
            _id: id,
          },
          {
            password,
          },
        );
      }
      if (name) {
        await this.userDB.updateOne(
          {
            _id: id,
          },
          {
            name,
          },
        );
      }
      return {
        success: true,
        message: 'User updated successfully',
        result: {
          name: user.name,
          email: user.email,
          type: user.type,
          id: user._id.toString(),
        },
      };
    } catch (error) {
      throw error;
    }
  }
  async findAll(type: string) {
    try {
      const users = await this.userDB.find({
        type,
      });
      return {
        success: true,
        message: 'Users fetched successfully',
        result: users,
      };
    } catch (error) {
      throw error;
    }
  }

  findOne(id: number) {
    return `This action returns a #${id} user`;
  }

  update(id: number, updateUserDto: UpdateUserDto) {
    return `This action updates a #${id} user`;
  }

  remove(id: number) {
    return `This action removes a #${id} user`;
  }
}
