export class Validators {
  // Validar CIP (debe ser alfanumérico y tener entre 3 y 20 caracteres)
  static validateCIP(CIP) {
    if (!CIP || typeof CIP !== 'string') {
      return { isValid: false, message: 'CIP es requerido y debe ser una cadena de texto' };
    }
    
    if (CIP.length < 3 || CIP.length > 20) {
      return { isValid: false, message: 'CIP debe tener entre 3 y 20 caracteres' };
    }
    
    // Permitir solo letras, números y algunos caracteres especiales
    const cipRegex = /^[a-zA-Z0-9\-_]+$/;
    if (!cipRegex.test(CIP)) {
      return { isValid: false, message: 'CIP solo puede contener letras, números, guiones y guiones bajos' };
    }
    
    return { isValid: true };
  }
  
  // Validar nombre de usuario
  static validateUsername(NombreUsuario) {
    if (!NombreUsuario || typeof NombreUsuario !== 'string') {
      return { isValid: false, message: 'Nombre de usuario es requerido y debe ser una cadena de texto' };
    }
    
    if (NombreUsuario.length < 3 || NombreUsuario.length > 30) {
      return { isValid: false, message: 'Nombre de usuario debe tener entre 3 y 30 caracteres' };
    }
    
    // Permitir solo letras, números, guiones y guiones bajos
    const usernameRegex = /^[a-zA-Z0-9\-_]+$/;
    if (!usernameRegex.test(NombreUsuario)) {
      return { isValid: false, message: 'Nombre de usuario solo puede contener letras, números, guiones y guiones bajos' };
    }
    
    return { isValid: true };
  }
  
  // Validar contraseña
  static validatePassword(Contrasena) {
    if (!Contrasena || typeof Contrasena !== 'string') {
      return { isValid: false, message: 'Contraseña es requerida y debe ser una cadena de texto' };
    }
    
    if (Contrasena.length < 6) {
      return { isValid: false, message: 'Contraseña debe tener al menos 6 caracteres' };
    }
    
    if (Contrasena.length > 128) {
      return { isValid: false, message: 'Contraseña no puede exceder 128 caracteres' };
    }
    
    return { isValid: true };
  }
  
  // Validar nombre completo
  static validateFullName(Nombre) {
    if (!Nombre || typeof Nombre !== 'string') {
      return { isValid: false, message: 'Nombre es requerido y debe ser una cadena de texto' };
    }
    
    if (Nombre.length < 2 || Nombre.length > 150) {
      return { isValid: false, message: 'Nombre debe tener entre 2 y 150 caracteres' };
    }
    
    // Permitir solo letras, espacios, guiones y apóstrofes
    const nameRegex = /^[a-zA-ZÀ-ÿ\s\-']+$/;
    if (!nameRegex.test(Nombre)) {
      return { isValid: false, message: 'El nombre completo del usuario solo puede contener letras, espacios, guiones y apóstrofes' };
    }
    
    return { isValid: true };
  }

  // Validar DNI
  static validateDNI(DNI) {
    if (!DNI || typeof DNI !== 'string') {
      return { isValid: false, message: 'DNI es requerido y debe ser una cadena de texto' };
    }
    
    if (DNI.length !== 8) {
      return { isValid: false, message: 'DNI debe tener exactamente 8 caracteres' };
    }
    
    // Solo números
    const dniRegex = /^[0-9]+$/;
    if (!dniRegex.test(DNI)) {
      return { isValid: false, message: 'DNI solo puede contener números' };
    }
    
    return { isValid: true };
  }

  // Validar email
  static validateEmail(Email) {
    if (!Email || typeof Email !== 'string') {
      return { isValid: false, message: 'Email es requerido y debe ser una cadena de texto' };
    }
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(Email)) {
      return { isValid: false, message: 'Email debe tener un formato válido' };
    }
    
    if (Email.length > 100) {
      return { isValid: false, message: 'Email no puede exceder 100 caracteres' };
    }
    
    return { isValid: true };
  }

  // Validar código Codofin
  static validateCodigoCodofin(CodigoCodofin) {
    if (!CodigoCodofin || typeof CodigoCodofin !== 'string') {
      return { isValid: false, message: 'Código Codofin es requerido y debe ser una cadena de texto' };
    }
    
    if (CodigoCodofin.length < 3 || CodigoCodofin.length > 20) {
      return { isValid: false, message: 'Código Codofin debe tener entre 3 y 20 caracteres' };
    }
    
    return { isValid: true };
  }

  // Validar teléfono
  static validateTelefono(Telefono) {
    if (!Telefono) return { isValid: true }; // Opcional
    
    if (typeof Telefono !== 'string') {
      return { isValid: false, message: 'Teléfono debe ser una cadena de texto' };
    }
    
    if (Telefono.length < 7 || Telefono.length > 15) {
      return { isValid: false, message: 'Teléfono debe tener entre 7 y 15 caracteres' };
    }
    
    // Solo números, espacios, guiones y paréntesis
    const telefonoRegex = /^[0-9\s\-\(\)]+$/;
    if (!telefonoRegex.test(Telefono)) {
      return { isValid: false, message: 'Teléfono solo puede contener números, espacios, guiones y paréntesis' };
    }
    
    return { isValid: true };
  }

  // Validar fecha
  static validateDate(fecha, campoNombre) {
    if (!fecha) return { isValid: true }; // Opcional
    
    if (typeof fecha !== 'string') {
      return { isValid: false, message: `${campoNombre} debe ser una cadena de texto` };
    }
    
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(fecha)) {
      return { isValid: false, message: `${campoNombre} debe tener formato YYYY-MM-DD` };
    }
    
    const date = new Date(fecha);
    if (isNaN(date.getTime())) {
      return { isValid: false, message: `${campoNombre} no es una fecha válida` };
    }
    
    return { isValid: true };
  }

  // Validar datos completos de administrador
  static validateAdminData(adminData) {
    const { CIP, nombre_usuario, password_hash, nombre_completo } = adminData;
    
    // Validar cada campo
    const cipValidation = this.validateCIP(CIP);
    if (!cipValidation.isValid) {
      return cipValidation;
    }
    
    const usernameValidation = this.validateUsername(nombre_usuario);
    if (!usernameValidation.isValid) {
      return usernameValidation;
    }
    
    const passwordValidation = this.validatePassword(password_hash);
    if (!passwordValidation.isValid) {
      return passwordValidation;
    }
    
    const nameValidation = this.validateFullName(nombre_completo);
    if (!nameValidation.isValid) {
      return nameValidation;
    }
    
    return { isValid: true };
  }
  
  // Validar credenciales de login
  static validateLoginCredentials(credentials) {
    const { CIP, password_hash } = credentials;
    
    if (!CIP || !password_hash) {
      return { isValid: false, message: 'CIP y contraseña son requeridos' };
    }
    
    const cipValidation = this.validateCIP(CIP);
    if (!cipValidation.isValid) {
      return cipValidation;
    }
    
    if (!password_hash || typeof password_hash !== 'string') {
      return { isValid: false, message: 'Contraseña es requerida' };
    }
    
    return { isValid: true };
  }

  // Validar datos completos de perito
  static validatePeritoData(peritoData) {
    const {
      CIP, nombre_completo, email, nombre_usuario, password_hash,
      dni, codigo_codofin
    } = peritoData;
    
    // Validar campos requeridos
    const cipValidation = this.validateCIP(CIP);
    if (!cipValidation.isValid) {
      return cipValidation;
    }
    
    const nombresValidation = this.validateFullName(nombre_completo);
    if (!nombresValidation.isValid) {
      return nombresValidation;
    }
    
    const emailValidation = this.validateEmail(email);
    if (!emailValidation.isValid) {
      return emailValidation;
    }
    
    const usernameValidation = this.validateUsername(nombre_usuario);
    if (!usernameValidation.isValid) {
      return usernameValidation;
    }
    
    const passwordValidation = this.validatePassword(password_hash);
    if (!passwordValidation.isValid) {
      return passwordValidation;
    }
    
    const dniValidation = this.validateDNI(dni);
    if (!dniValidation.isValid) {
      return dniValidation;
    }
    
    const codigoValidation = this.validateCodigoCodofin(codigo_codofin);
    if (!codigoValidation.isValid) {
      return codigoValidation;
    }
    
    // Validar campos opcionales si están presentes
    if (peritoData.Telefono) {
      const telefonoValidation = this.validateTelefono(peritoData.Telefono);
      if (!telefonoValidation.isValid) {
        return telefonoValidation;
      }
    }
    
    if (peritoData.FechaIntegracion) {
      const fechaIntegracionValidation = this.validateDate(peritoData.FechaIntegracion, 'Fecha de Integración');
      if (!fechaIntegracionValidation.isValid) {
        return fechaIntegracionValidation;
      }
    }
    
    if (peritoData.FechaIncorporacion) {
      const fechaIncorporacionValidation = this.validateDate(peritoData.FechaIncorporacion, 'Fecha de Incorporación');
      if (!fechaIncorporacionValidation.isValid) {
        return fechaIncorporacionValidation;
      }
    }
    
    return { isValid: true };
  }

  // Validar datos de actualización de perito
  static validatePeritoUpdateData(updateData) {
    // Validar que al menos un campo esté presente
    if (Object.keys(updateData).length === 0) {
      return { isValid: false, message: 'Al menos un campo debe ser proporcionado para actualizar' };
    }
    
    // Validar cada campo presente
    for (const [key, value] of Object.entries(updateData)) {
      switch (key) {
        case 'Nombres':
          const nombresValidation = this.validateFullName(value);
          if (!nombresValidation.isValid) {
            return nombresValidation;
          }
          break;
          
        case 'Apellidos':
          const apellidosValidation = this.validateFullName(value);
          if (!apellidosValidation.isValid) {
            return apellidosValidation;
          }
          break;
          
        case 'Email':
          const emailValidation = this.validateEmail(value);
          if (!emailValidation.isValid) {
            return emailValidation;
          }
          break;
          
        case 'DNI':
          const dniValidation = this.validateDNI(value);
          if (!dniValidation.isValid) {
            return dniValidation;
          }
          break;
          
        case 'Telefono':
          const telefonoValidation = this.validateTelefono(value);
          if (!telefonoValidation.isValid) {
            return telefonoValidation;
          }
          break;
          
        case 'FechaIntegracion':
        case 'FechaIncorporacion':
          const fechaValidation = this.validateDate(value, key);
          if (!fechaValidation.isValid) {
            return fechaValidation;
          }
          break;
          
        case 'CodigoCodofin':
          const codigoValidation = this.validateCodigoCodofin(value);
          if (!codigoValidation.isValid) {
            return codigoValidation;
          }
          break;
          
        // Otros campos son opcionales y no requieren validación especial
        case 'Seccion':
        case 'Especialidad':
        case 'Grado':
        case 'UltimoCenso':
        case 'Domicilio':
        case 'Fotografia':
        case 'Firma':
        case 'NombreUsuario':
          // Estos campos son opcionales y no requieren validación especial
          break;
          
        default:
          return { isValid: false, message: `Campo '${key}' no es válido para actualización` };
      }
    }
    
    return { isValid: true };
  }
}
