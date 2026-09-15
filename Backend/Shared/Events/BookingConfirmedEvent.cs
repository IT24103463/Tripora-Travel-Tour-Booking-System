using System;

namespace Tripora.Shared.Events;

public interface BookingConfirmedEvent
{
    Guid BookingId { get; }
    Guid ItemId { get; }
    string ItemType { get; }
    int Quantity { get; }
    DateTime Timestamp { get; }
}
