import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  ReactiveFormsModule,
  FormBuilder,
  FormGroup,
  Validators,
  AbstractControl,
  ValidationErrors,
  ValidatorFn,
} from '@angular/forms';
import {
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonList,
  IonItem,
  IonInput,
  IonSelect,
  IonSelectOption,
  IonButton,
  IonSpinner,
  IonToast,
} from '@ionic/angular';

/**
 * Validador personalizado para Código de Barras (SKU):
 * Exactamente 12 caracteres alfanuméricos.
 */
export function skuValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    if (!control.value) {
      return null; // Deja que Validators.required maneje el campo vacío
    }
    const regex = /^[a-zA-Z0-9]{12}$/;
    return regex.test(control.value) ? null : { invalidSku: true };
  };
}

/**
 * Validador personalizado para Stock Mínimo:
 * Debe ser un número estrictamente mayor que 0.
 */
export function greaterThanZeroValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    if (control.value === null || control.value === undefined || control.value === '') {
      return null; // Deja que Validators.required maneje el campo vacío
    }
    const val = Number(control.value);
    return !isNaN(val) && val > 0 ? null : { greaterThanZero: true };
  };
}

/**
 * Validador personalizado para Fecha de Nacimiento:
 * No puede ser una fecha futura.
 */
export function fechaNacimientoValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    if (!control.value) {
      return null; // Deja que Validators.required maneje el campo vacío
    }
    const selectedDate = new Date(control.value);
    const today = new Date();
    today.setHours(23, 59, 59, 999);
    return selectedDate > today ? { futureDate: true } : null;
  };
}

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonList,
    IonItem,
    IonInput,
    IonSelect,
    IonSelectOption,
    IonButton,
    IonSpinner,
    IonToast,
  ],
})
export class HomePage {
  // Definición del formulario reactivo fuertemente tipado
  public productoForm: FormGroup;

  // Uso de Signals para gestionar el estado de envío y el feedback
  public isSubmitting = signal<boolean>(false);
  public showToast = signal<boolean>(false);
  public maxDate: string = new Date().toISOString().split('T')[0];

  constructor(private fb: FormBuilder) {
    this.productoForm = this.fb.group({
      // Código de Barras (SKU): Obligatorio, exactamente 12 caracteres alfanuméricos
      sku: ['', [Validators.required, skuValidator()]],
      // Nombre del Producto: Obligatorio
      nombre: ['', [Validators.required]],
      // Categoría: Menú desplegable con al menos 3 opciones
      categoria: ['', [Validators.required]],
      // Stock Mínimo: Obligatorio, valor numérico mayor que 0
      stockMinimo: ['', [Validators.required, greaterThanZeroValidator()]],
      // Fecha de Nacimiento: Obligatoria, no futura
      fechaNacimiento: ['', [Validators.required, fechaNacimientoValidator()]],
    });
  }

  // Getter de conveniencia para acceder a los controles en la vista
  get f() {
    return this.productoForm.controls;
  }

  // Getters para mensajes de error claros usando errorText de Ionic
  get skuError(): string {
    const control = this.productoForm.get('sku');
    if (control?.hasError('required')) {
      return 'El código SKU es obligatorio.';
    }
    if (control?.hasError('invalidSku')) {
      return 'El SKU debe tener exactamente 12 caracteres alfanuméricos.';
    }
    return '';
  }

  get nombreError(): string {
    const control = this.productoForm.get('nombre');
    if (control?.hasError('required')) {
      return 'El nombre del producto es obligatorio.';
    }
    return '';
  }

  get categoriaError(): string {
    const control = this.productoForm.get('categoria');
    if (control?.hasError('required')) {
      return 'Debe seleccionar una categoría.';
    }
    return '';
  }

  get stockMinimoError(): string {
    const control = this.productoForm.get('stockMinimo');
    if (control?.hasError('required')) {
      return 'El stock mínimo es obligatorio.';
    }
    if (control?.hasError('greaterThanZero')) {
      return 'El stock mínimo debe ser un número mayor a 0.';
    }
    return '';
  }

  get fechaNacimientoError(): string {
    const control = this.productoForm.get('fechaNacimiento');
    if (control?.hasError('required')) {
      return 'La fecha de nacimiento es obligatoria.';
    }
    if (control?.hasError('futureDate')) {
      return 'La fecha de nacimiento no puede ser futura.';
    }
    return '';
  }

  public async onSubmit(): Promise<void> {
    if (this.productoForm.invalid) {
      this.productoForm.markAllAsTouched(); // Fuerza la visualización de errores
      return;
    }

    // Gestionar estado con Signal y desactivar el formulario
    this.isSubmitting.set(true);
    this.productoForm.disable();

    try {
      const formData = this.productoForm.getRawValue();
      console.log('Payload a enviar (Datos del Producto):', formData);

      // Simulación de petición asíncrona de guardado (2 segundos)
      await new Promise((resolve) => setTimeout(resolve, 2000));

      // Reset del formulario tras el guardado
      this.productoForm.reset();
      this.productoForm.markAsPristine();
      this.productoForm.markAsUntouched();

      // Mostrar confirmación mediante ion-toast
      this.showToast.set(true);
    } catch (error) {
      console.error('Error al persistir los datos del producto', error);
    } finally {
      this.productoForm.enable();
      this.isSubmitting.set(false);
    }
  }
}
